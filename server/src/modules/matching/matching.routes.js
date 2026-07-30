const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { findMatches } = require('./matching.controller');

router.get('/', requireAuth, findMatches);

module.exports = router;