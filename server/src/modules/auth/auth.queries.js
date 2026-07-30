const pool = require('../../db/pool');

async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createUser({ id, email, passwordHash }) {
  await pool.query(
    'INSERT INTO users (id, email, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?)',
    [id, email, passwordHash, 'user', false]
  );
}

async function createAuthToken({ id, userId, token, type, expiresAt }) {
  await pool.query(
    'INSERT INTO auth_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, ?, ?)',
    [id, userId, token, type, expiresAt]
  );
}

async function createRefreshToken({ id, userId, tokenHash, expiresAt }) {
  await pool.query(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [id, userId, tokenHash, expiresAt]
  );
}

async function findRefreshTokenByHash(tokenHash) {
  const [rows] = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = false',
    [tokenHash]
  );
  return rows[0] || null;
}

async function findTokenByValue(token, type) {
  const [rows] = await pool.query(
    'SELECT * FROM auth_tokens WHERE token = ? AND type = ?',
    [token, type]
  );
  return rows[0] || null;
}

async function deleteTokensForUser(userId, type) {
  await pool.query('DELETE FROM auth_tokens WHERE user_id = ? AND type = ?', [userId, type]);
}

async function markEmailVerified(userId) {
  await pool.query('UPDATE users SET email_verified = true WHERE id = ?', [userId]);
}

async function updatePassword(userId, passwordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}

async function revokeAllRefreshTokens(userId) {
  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = ?', [userId]);
}

module.exports = {
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
};