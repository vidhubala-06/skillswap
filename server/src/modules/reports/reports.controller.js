const { getSwapParticipants, getConversationSwapId, createReport } = require('./reports.queries');

async function submitReport(req, res) {
    try {
        const { swapId, conversationId, reason } = req.body;
        const reporterId = req.user.id;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ error: 'A reason is required' });
        }

        let resolvedSwapId = swapId;
        let requesterId, recipientId;

        if (conversationId && !swapId) {
            const convo = await getConversationSwapId(conversationId);
            if (!convo) return res.status(404).json({ error: 'Conversation not found' });
            if (convo.userAId !== reporterId && convo.userBId !== reporterId) {
                return res.status(403).json({ error: 'You are not part of this conversation' });
            }
            resolvedSwapId = convo.swapId;
            requesterId = convo.userAId;
            recipientId = convo.userBId;
        } else {
            const swap = await getSwapParticipants(resolvedSwapId);
            if (!swap) return res.status(404).json({ error: 'Swap not found' });
            if (swap.requesterId !== reporterId && swap.recipientId !== reporterId) {
                return res.status(403).json({ error: 'You are not part of this swap' });
            }
            requesterId = swap.requesterId;
            recipientId = swap.recipientId;
        }

        const reportedUserId = requesterId === reporterId ? recipientId : requesterId;

        await createReport({ reporterId, reportedUserId, swapRequestId: resolvedSwapId, reason: reason.trim() });

        return res.status(201).json({ success: true, message: 'Report submitted. Our team will review it.' });
    } catch (err) {
        console.error('Submit report error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

module.exports = { submitReport };