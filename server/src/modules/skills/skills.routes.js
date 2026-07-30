const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { search, suggest } = require('./skills.controller');

router.get('/search', requireAuth, search);
router.post('/suggest', requireAuth, suggest);

module.exports = router;