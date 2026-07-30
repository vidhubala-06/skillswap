const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const {
  findUserByEmail,
  findUserById,
  createUser,
  createAuthToken,
  createRefreshToken,
  findRefreshTokenByHash,
  findTokenByValue,
  deleteTokensForUser,
  markEmailVerified,
  updatePassword,
  revokeAllRefreshTokens
} = require('./auth.queries');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../config/resend');

async function signup(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await createUser({ id: userId, email, passwordHash });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await createAuthToken({
      id: uuidv4(),
      userId,
      token,
      type: 'email_verification',
      expiresAt
    });

    await sendVerificationEmail(email, token);

    return res.status(201).json({ success: true, message: 'Account created. Please verify your email.' });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account exists, a verification email has been sent.' });
    }
    if (user.email_verified) {
      return res.status(200).json({ success: true, message: 'This email is already verified. Please log in.' });
    }

    await deleteTokensForUser(user.id, 'email_verification');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await createAuthToken({ id: uuidv4(), userId: user.id, token, type: 'email_verification', expiresAt });

    await sendVerificationEmail(email, token);

    return res.status(200).json({ success: true, message: 'Verification email resent!' });
  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.body;
    const tokenRow = await findTokenByValue(token, 'email_verification');

    if (!tokenRow) {
      return res.status(400).json({ error: 'Invalid or already-used link' });
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This link has expired. Please request a new one.' });
    }

    await markEmailVerified(tokenRow.user_id);
    await deleteTokensForUser(tokenRow.user_id, 'email_verification');

    return res.status(200).json({ success: true, message: 'Email verified successfully!' });
  } catch (err) {
    console.error('Verify email error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in' });
    }

    if (user.account_status === 'permanently_banned') {
      return res.status(403).json({ error: 'ACCOUNT_BANNED' });
    }
    if (user.account_status === 'temp_banned' && new Date(user.temp_ban_until) > new Date()) {
      return res.status(403).json({ error: 'ACCOUNT_BANNED', until: user.temp_ban_until });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshTokenRaw = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await createRefreshToken({
      id: uuidv4(),
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });
    res.cookie('refreshToken', refreshTokenRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      user: { id: user.id, role: user.role }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function refresh(req, res) {
  try {
    const refreshTokenRaw = req.cookies.refreshToken;
    if (!refreshTokenRaw) {
      return res.status(401).json({ error: 'NO_REFRESH_TOKEN' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const tokenRow = await findRefreshTokenByHash(tokenHash);

    if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
      return res.status(401).json({ error: 'INVALID_REFRESH_TOKEN' });
    }

    const user = await findUserById(tokenRow.user_id);
    if (!user) {
      return res.status(401).json({ error: 'INVALID_REFRESH_TOKEN' });
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);

    const genericResponse = { success: true, message: 'If an account exists with this email, a reset link has been sent.' };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    await deleteTokensForUser(user.id, 'password_reset');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await createAuthToken({ id: uuidv4(), userId: user.id, token, type: 'password_reset', expiresAt });

    await sendPasswordResetEmail(user.email, token);

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const tokenRow = await findTokenByValue(token, 'password_reset');

    if (!tokenRow) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This link has expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updatePassword(tokenRow.user_id, passwordHash);
    await deleteTokensForUser(tokenRow.user_id, 'password_reset');
    await revokeAllRefreshTokens(tokenRow.user_id);

    return res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function me(req, res) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ user: { id: user.id, role: user.role, email: user.email } });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function logout(req, res) {
  try {
    const refreshTokenRaw = req.cookies.refreshToken;
    if (refreshTokenRaw) {
      const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
      await require('../../db/pool').query(
        'UPDATE refresh_tokens SET revoked = true WHERE token_hash = ?',
        [tokenHash]
      );
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { signup, resendVerification, verifyEmail, login, refresh, forgotPassword, resetPassword, me, logout };