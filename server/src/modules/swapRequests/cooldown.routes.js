const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { setCooldown, getTaughtSkill, listTeachingCooldowns, editCooldown } = require('./cooldown.controller');

router.get('/mine', requireAuth, listTeachingCooldowns);
router.get('/:swapId/taught-skill', requireAuth, getTaughtSkill);
router.post('/', requireAuth, setCooldown);
router.post('/:skillId/edit', requireAuth, editCooldown);

module.exports = router;