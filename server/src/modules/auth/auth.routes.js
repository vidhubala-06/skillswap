const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { loginLimiter, signupLimiter, resendLimiter } = require('../../middleware/rateLimiter');

const { signup, resendVerification, verifyEmail, login, refresh, forgotPassword, resetPassword, me, logout } = require('./auth.controller');
router.post('/signup', signupLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/resend-verification', resendLimiter, resendVerification);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', resendLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

module.exports = router;