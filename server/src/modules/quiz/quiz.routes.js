const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { getStatus, startQuiz, submitQuiz, getSession } = require('./quiz.controller');

router.get('/status', requireAuth, getStatus);
router.post('/start', requireAuth, startQuiz);
router.post('/submit', requireAuth, submitQuiz);
router.get('/session/:sessionId', requireAuth, getSession);

module.exports = router;