const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const upload = require('../../config/multer');
const { listInbox, loadMessages, sendMessage, uploadFile, unreadCount, markRead } = require('./chat.controller');

router.get('/inbox', requireAuth, listInbox);
router.get('/unread-count', requireAuth, unreadCount);
router.get('/:conversationId/messages', requireAuth, loadMessages);
router.post('/:conversationId/messages', requireAuth, sendMessage);
router.post('/:conversationId/upload', requireAuth, upload.single('file'), uploadFile);
router.post('/:conversationId/read', requireAuth, markRead);

module.exports = router;