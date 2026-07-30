const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { list, read, readAll, unreadCount } = require('./notifications.controller');

router.get('/', requireAuth, list);
router.get('/unread-count', requireAuth, unreadCount);
router.post('/:id/read', requireAuth, read);
router.post('/read-all', requireAuth, readAll);

module.exports = router;