const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');

const { signup, resendVerification, verifyEmail, login, refresh, forgotPassword, resetPassword, me, logout } = require('./auth.controller');
router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/resend-verification', resendVerification);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

module.exports = router;