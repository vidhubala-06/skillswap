const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { submitReport } = require('./reports.controller');

router.post('/', requireAuth, submitReport);

module.exports = router;