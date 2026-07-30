const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { saveProfile, saveSelfRating, loadProfile, viewPublicProfile } = require('./profile.controller');
const { getDashboard } = require('./dashboard.controller');





router.post('/', requireAuth, saveProfile);
router.post('/self-rating', requireAuth, saveSelfRating);
router.get('/dashboard-data', requireAuth, getDashboard);
router.get('/', requireAuth, loadProfile);
router.get('/:userId/public', requireAuth, viewPublicProfile);

module.exports = router;