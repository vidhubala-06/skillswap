const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 8,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: 'Too many accounts created from this location. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const resendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: { error: 'Too many resend attempts. Please wait before trying again.' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { loginLimiter, signupLimiter, resendLimiter };