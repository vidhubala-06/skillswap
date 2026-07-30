const { v4: uuidv4 } = require('uuid');
const { getIO } = require('../../socket');
const {
    getInbox, getConversationParticipants, getSwapStatus, getMessages, insertMessage
} = require('./chat.queries');
const fs = require('fs');
const cloudinary = require('../../config/cloudinary');

const SENDABLE_STATUSES = ['pending', 'accepted', 'in_progress'];

async function listInbox(req, res) {
    try {
        const conversations = await getInbox(req.user.id);
        return res.status(200).json({ conversations });
    } catch (err) {
        console.error('List inbox error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

async function loadMessages(req, res) {
    try {
        const { conversationId } = req.params;
        const { before } = req.query;

        const participants = await getConversationParticipants(conversationId);
        if (!participants) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        if (participants.userAId !== req.user.id && participants.userBId !== req.user.id) {
            return res.status(403).json({ error: 'You are not part of this conversation' });
        }

        const messages = await getMessages(conversationId, before || null);
        const swapStatus = await getSwapStatus(participants.latestSwapRequestId);
        const canSend = SENDABLE_STATUSES.includes(swapStatus);

        return res.status(200).json({ messages, canSend });
    } catch (err) {
        console.error('Load messages error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

async function sendMessage(req, res) {
    try {
        const { conversationId } = req.params;
        const { message } = req.body;
        const senderId = req.user.id;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        const participants = await getConversationParticipants(conversationId);
        if (!participants) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        if (participants.userAId !== senderId && participants.userBId !== senderId) {
            return res.status(403).json({ error: 'You are not part of this conversation' });
        }

        const swapStatus = await getSwapStatus(participants.latestSwapRequestId);
        if (!SENDABLE_STATUSES.includes(swapStatus)) {
            return res.status(403).json({ error: 'This conversation is closed' });
        }

        const messageId = uuidv4();
        await insertMessage({
            id: messageId,
            conversationId,
            senderId,
            messageType: 'text',
            message: message.trim()
        });

        const payload = {
            id: messageId,
            conversationId,
            senderId,
            messageType: 'text',
            message: message.trim(),
            createdAt: new Date().toISOString()
        };

        getIO().to(conversationId).emit('new-message', payload);

        return res.status(201).json({ success: true, message: payload });
    } catch (err) {
        console.error('Send message error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}
async function uploadFile(req, res) {
    try {
        const { conversationId } = req.params;
        const senderId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const participants = await getConversationParticipants(conversationId);
        if (!participants) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Conversation not found' });
        }
        if (participants.userAId !== senderId && participants.userBId !== senderId) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'You are not part of this conversation' });
        }

        const swapStatus = await getSwapStatus(participants.latestSwapRequestId);
        if (!SENDABLE_STATUSES.includes(swapStatus)) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'This conversation is closed' });
        }

        const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });
        fs.unlinkSync(req.file.path); // clean up the local temp file now that it's uploaded

        const messageType = result.resource_type === 'image' ? 'image' : 'file';
        const messageId = uuidv4();

        await insertMessage({
            id: messageId,
            conversationId,
            senderId,
            messageType,
            message: null,
            attachmentUrl: result.secure_url,
            attachmentName: req.file.originalname,
            attachmentSize: req.file.size
        });

        const payload = {
            id: messageId,
            conversationId,
            senderId,
            messageType,
            attachmentUrl: result.secure_url,
            attachmentName: req.file.originalname,
            attachmentSize: req.file.size,
            createdAt: new Date().toISOString()
        };

        getIO().to(conversationId).emit('new-message', payload);

        return res.status(201).json({ success: true, message: payload });
    } catch (err) {
        console.error('Upload file error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

module.exports = { listInbox, loadMessages, sendMessage, uploadFile };