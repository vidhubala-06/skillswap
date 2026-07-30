const { v4: uuidv4 } = require('uuid');
const pool = require('../../db/pool');
const {
  getSkillStatus, isUserLocked, hasDuplicatePendingRequest, isInTeachingCooldown,
  createSwapRequest, upsertConversation, getConversationIdForPair,
  getReceivedRequests, getSentRequests, getCompletedRequests, getFullHistory,
  getRequestForUpdate, areEitherLocked, acceptRequestTx, createLocksTx, autoCancelOtherPendingTx,
  rejectRequest, cancelRequest
} = require('./swapRequests.queries');
const { createNotification } = require('../notifications/notifications.queries');
const { sendSwapRequestEmail, sendSwapAcceptedEmail, sendSwapRejectedEmail } = require('../../config/resend');
const { getIO } = require('../../socket');

async function sendRequest(req, res) {
  try {
    const { recipientId, offeredSkillId, wantedSkillId } = req.body;
    const requesterId = req.user.id;

    if (requesterId === recipientId) {
      return res.status(400).json({ error: 'You cannot send a request to yourself' });
    }

    // Validate requester's offered skill is verified
    const offeredStatus = await getSkillStatus(requesterId, offeredSkillId);
    if (!offeredStatus || offeredStatus.status !== 'verified') {
      return res.status(400).json({ error: 'REQUESTER_SKILL_UNAVAILABLE', message: 'You must be verified in this skill to offer it' });
    }

    // Validate recipient's wanted skill is verified
    const wantedStatus = await getSkillStatus(recipientId, wantedSkillId);
    if (!wantedStatus || wantedStatus.status !== 'verified') {
      return res.status(409).json({ error: 'RECIPIENT_SKILL_UNAVAILABLE', message: 'This user no longer teaches this skill' });
    }

    // Neither party locked
    if (await isUserLocked(requesterId)) {
      return res.status(409).json({ error: 'REQUESTER_LOCKED', message: 'You are currently in an active swap' });
    }
    if (await isUserLocked(recipientId)) {
      return res.status(409).json({ error: 'RECIPIENT_LOCKED', message: 'This user just became unavailable' });
    }

    // No duplicate pending request
    if (await hasDuplicatePendingRequest({ requesterId, recipientId, wantedSkillId })) {
      return res.status(409).json({ error: 'DUPLICATE_PENDING_REQUEST', message: 'You already have a pending request with this user for this skill' });
    }

    // Recipient not in teaching cooldown for this skill
    if (await isInTeachingCooldown(recipientId, wantedSkillId)) {
      return res.status(409).json({ error: 'RECIPIENT_IN_COOLDOWN', message: "This user isn't currently teaching this skill" });
    }

    // All validation passed — create the request + open the conversation
    const swapId = uuidv4();
    await createSwapRequest({ id: swapId, requesterId, recipientId, offeredSkillId, wantedSkillId });
    await upsertConversation({ id: uuidv4(), userAId: requesterId, userBId: recipientId, swapRequestId: swapId });
    const conversationId = await getConversationIdForPair(requesterId, recipientId);

    await createNotification({
      userId: recipientId,
      type: 'swap_request_received',
      message: `You have a new swap request`,
      relatedSwapId: swapId
    });

    getIO().to(recipientId).emit('swap-request-updated');

    const [recipientRows] = await pool.query('SELECT email FROM users WHERE id = ?', [recipientId]);
    const [requesterProfileRows] = await pool.query('SELECT name FROM profiles WHERE user_id = ?', [requesterId]);
    const [skillRows] = await pool.query('SELECT name FROM skills WHERE id = ?', [wantedSkillId]);

    await sendSwapRequestEmail(recipientRows[0].email, requesterProfileRows[0].name, skillRows[0].name);

    return res.status(201).json({ success: true, swapId, conversationId });
  } catch (err) {
    console.error('Send swap request error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listReceived(req, res) {
  try {
    const requests = await getReceivedRequests(req.user.id);
    return res.status(200).json({ requests });
  } catch (err) {
    console.error('List received error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listSent(req, res) {
  try {
    const requests = await getSentRequests(req.user.id);
    return res.status(200).json({ requests });
  } catch (err) {
    console.error('List sent error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listCompleted(req, res) {
  try {
    const requests = await getCompletedRequests(req.user.id);
    return res.status(200).json({ requests });
  } catch (err) {
    console.error('List completed error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listFullHistory(req, res) {
  try {
    const requests = await getFullHistory(req.user.id);
    return res.status(200).json({ requests });
  } catch (err) {
    console.error('List full history error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function acceptRequest(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const request = await getRequestForUpdate(connection, req.params.id);
    if (!request || request.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ error: 'This request is no longer pending' });
    }
    if (request.recipient_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: 'You are not the recipient of this request' });
    }

    const locked = await areEitherLocked(connection, request.requester_id, request.recipient_id);
    if (locked) {
      await connection.rollback();
      return res.status(409).json({ error: 'One of the users is already in an active swap' });
    }

    await acceptRequestTx(connection, req.params.id);
    await createLocksTx(connection, {
      userIdA: request.requester_id,
      userIdB: request.recipient_id,
      swapId: req.params.id
    });
    await autoCancelOtherPendingTx(connection, {
      userIdA: request.requester_id,
      userIdB: request.recipient_id,
      excludeSwapId: req.params.id
    });

    await connection.commit();

    await createNotification({
      userId: request.requester_id,
      type: 'swap_request_accepted',
      message: `Your swap request was accepted!`,
      relatedSwapId: req.params.id
    });

    getIO().to(request.requester_id).emit('swap-request-updated');
    getIO().to(request.recipient_id).emit('swap-request-updated');

    const [requesterRows] = await pool.query('SELECT email FROM users WHERE id = ?', [request.requester_id]);
    const [recipientProfileRows] = await pool.query('SELECT name FROM profiles WHERE user_id = ?', [request.recipient_id]);

    await sendSwapAcceptedEmail(requesterRows[0].email, recipientProfileRows[0].name);

    return res.status(200).json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error('Accept request error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  } finally {
    connection.release();
  }
}

async function rejectRequestHandler(req, res) {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'A reason is required' });
    }
    const success = await rejectRequest(req.params.id, reason.trim());
    if (!success) {
      return res.status(400).json({ error: 'This request is no longer pending' });
    }
    const [rows] = await require('../../db/pool').query('SELECT requester_id FROM swap_requests WHERE id = ?', [req.params.id]);
    await createNotification({
      userId: rows[0].requester_id,
      type: 'swap_request_rejected',
      message: `Your swap request was declined`,
      relatedSwapId: req.params.id
    });

    getIO().to(rows[0].requester_id).emit('swap-request-updated');

    const [requesterRows2] = await pool.query('SELECT email FROM users WHERE id = ?', [rows[0].requester_id]);
    const [recipientProfileRows2] = await pool.query('SELECT name FROM profiles WHERE user_id = ?', [req.user.id]);

    await sendSwapRejectedEmail(requesterRows2[0].email, recipientProfileRows2[0].name, reason);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Reject request error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function cancelRequestHandler(req, res) {
  try {
    const success = await cancelRequest(req.params.id, req.user.id);
    if (!success) {
      return res.status(400).json({ error: 'This request can no longer be cancelled' });
    }
    getIO().to(req.user.id).emit('swap-request-updated');
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Cancel request error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { 
  sendRequest, listReceived, listSent, listCompleted, listFullHistory,
  acceptRequest, rejectRequestHandler, cancelRequestHandler 
};