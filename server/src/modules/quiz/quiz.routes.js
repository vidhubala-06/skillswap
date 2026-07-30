const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { getStatus, startQuiz, submitQuiz } = require('./quiz.controller');

router.get('/status', requireAuth, getStatus);
router.post('/start', requireAuth, startQuiz);
router.post('/submit', requireAuth, submitQuiz);

module.exports = router;