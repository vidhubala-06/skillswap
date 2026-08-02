const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const upload = require('../../config/multerMultiple');
const { checkEligibility, postProject, getFeed, getUserFeedProfile, submitProjectReport } = require('./feed.controller');

router.get('/eligibility', requireAuth, checkEligibility);
router.post('/', requireAuth, upload.array('images', 5), postProject);
router.get('/', requireAuth, getFeed);
router.get('/user/:userId', requireAuth, getUserFeedProfile);
router.post('/:id/report', requireAuth, submitProjectReport);

module.exports = router;