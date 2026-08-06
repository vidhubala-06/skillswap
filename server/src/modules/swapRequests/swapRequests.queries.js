const pool = require('../../db/pool');
const { v4: uuidv4 } = require('uuid');

async function getSkillStatus(userId, skillId) {
  const [rows] = await pool.query(
    'SELECT status FROM user_known_skills WHERE user_id = ? AND skill_id = ?',
    [userId, skillId]
  );
  return rows[0] || null;
}

async function isUserLocked(userId) {
  const [rows] = await pool.query('SELECT 1 FROM user_locks WHERE user_id = ?', [userId]);
  return rows.length > 0;
}

async function hasDuplicatePendingRequest({ requesterId, recipientId, wantedSkillId }) {
  const [rows] = await pool.query(
    `SELECT id FROM swap_requests 
     WHERE requester_id = ? AND recipient_id = ? AND wanted_skill_id = ? AND status = 'pending'`,
    [requesterId, recipientId, wantedSkillId]
  );
  return rows.length > 0;
}

async function isInTeachingCooldown(userId, skillId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM skill_cooldowns 
     WHERE user_id = ? AND skill_id = ? AND cooldown_until IS NOT NULL AND cooldown_until > NOW()`,
    [userId, skillId]
  );
  return rows.length > 0;
}

async function createSwapRequest({ id, requesterId, recipientId, offeredSkillId, wantedSkillId }) {
  await pool.query(
    `INSERT INTO swap_requests (id, requester_id, recipient_id, offered_skill_id, wanted_skill_id, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [id, requesterId, recipientId, offeredSkillId, wantedSkillId]
  );
}

async function upsertConversation({ id, userAId, userBId, swapRequestId }) {
  await pool.query(
    `INSERT INTO conversations (id, user_a_id, user_b_id, latest_swap_request_id)
     VALUES (?, LEAST(?, ?), GREATEST(?, ?), ?)
     ON DUPLICATE KEY UPDATE latest_swap_request_id = VALUES(latest_swap_request_id)`,
    [id, userAId, userBId, userAId, userBId, swapRequestId]
  );
}

async function getRequestForUpdate(connection, requestId) {
  const [rows] = await connection.query(
    'SELECT status, requester_id, recipient_id FROM swap_requests WHERE id = ? FOR UPDATE',
    [requestId]
  );
  return rows[0] || null;
}

async function areEitherLocked(connection, userIdA, userIdB) {
  const [rows] = await connection.query(
    'SELECT user_id FROM user_locks WHERE user_id IN (?, ?)',
    [userIdA, userIdB]
  );
  return rows.length > 0;
}

async function acceptRequestTx(connection, requestId) {
  await connection.query(
    `UPDATE swap_requests SET status = 'accepted', updated_at = NOW() WHERE id = ?`,
    [requestId]
  );
}

async function createLocksTx(connection, { userIdA, userIdB, swapId }) {
  await connection.query(
    `INSERT INTO user_locks (user_id, locked_by_swap_id) VALUES (?, ?), (?, ?)`,
    [userIdA, swapId, userIdB, swapId]
  );
}

async function autoCancelOtherPendingTx(connection, { userIdA, userIdB, excludeSwapId }) {
  await connection.query(
    `UPDATE swap_requests 
     SET status = 'cancelled', updated_at = NOW()
     WHERE (requester_id IN (?, ?) OR recipient_id IN (?, ?)) 
       AND status = 'pending' 
       AND id != ?`,
    [userIdA, userIdB, userIdA, userIdB, excludeSwapId]
  );
}

async function rejectRequest(requestId, reason) {
  const [result] = await pool.query(
    `UPDATE swap_requests SET status = 'rejected', reject_reason = ?, updated_at = NOW() 
     WHERE id = ? AND status = 'pending'`,
    [reason, requestId]
  );
  return result.affectedRows > 0;
}

async function cancelRequest(requestId, requesterId) {
  const [result] = await pool.query(
    `UPDATE swap_requests SET status = 'cancelled', updated_at = NOW() 
     WHERE id = ? AND requester_id = ? AND status = 'pending'`,
    [requestId, requesterId]
  );
  return result.affectedRows > 0;
}

async function getReceivedRequests(userId) {
  const [rows] = await pool.query(
    `SELECT sr.id, sr.status, sr.created_at,
            u.id AS requesterId, p.name AS requesterName,
            os.name AS offeredSkillName, ws.name AS wantedSkillName
     FROM swap_requests sr
     JOIN users u ON u.id = sr.requester_id
     JOIN profiles p ON p.user_id = u.id
     JOIN skills os ON os.id = sr.offered_skill_id
     JOIN skills ws ON ws.id = sr.wanted_skill_id
     WHERE sr.recipient_id = ? 
       AND (
         sr.status = 'pending' 
         OR (sr.status = 'cancelled' AND sr.updated_at > NOW() - INTERVAL 14 DAY)
       )
     ORDER BY 
       CASE WHEN sr.status = 'pending' THEN 0 ELSE 1 END,
       sr.created_at DESC`,
    [userId]
  );
  return rows;
}

async function getSentRequests(userId) {
  const [rows] = await pool.query(
    `SELECT sr.id, sr.status, sr.reject_reason AS rejectReason, sr.created_at,
            u.id AS recipientId, p.name AS recipientName,
            os.name AS offeredSkillName, ws.name AS wantedSkillName
     FROM swap_requests sr
     JOIN users u ON u.id = sr.recipient_id
     JOIN profiles p ON p.user_id = u.id
     JOIN skills os ON os.id = sr.offered_skill_id
     JOIN skills ws ON ws.id = sr.wanted_skill_id
     WHERE sr.requester_id = ? AND sr.status != 'completed'
     ORDER BY sr.created_at DESC`,
    [userId]
  );
  return rows;
}

async function getCompletedRequests(userId) {
  const [rows] = await pool.query(
    `SELECT sr.id, sr.completed_at,
            CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END AS partnerId,
            p.name AS partnerName,
            CASE WHEN sr.requester_id = ? THEN os.name ELSE ws.name END AS skillITaught,
            CASE WHEN sr.requester_id = ? THEN ws.name ELSE os.name END AS skillILearned
     FROM swap_requests sr
     JOIN skills os ON os.id = sr.offered_skill_id
     JOIN skills ws ON ws.id = sr.wanted_skill_id
     JOIN profiles p ON p.user_id = (CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END)
     WHERE (sr.requester_id = ? OR sr.recipient_id = ?) AND sr.status = 'completed'
     ORDER BY sr.completed_at DESC`,
    [userId, userId, userId, userId, userId, userId]
  );
  return rows;
}

async function getFullHistory(userId) {
  const [rows] = await pool.query(
    `SELECT sr.id, sr.status, sr.created_at AS createdAt, sr.completed_at AS completedAt,
            sr.reject_reason AS rejectReason,
            CASE WHEN sr.requester_id = ? THEN 'sent' ELSE 'received' END AS direction,
            CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END AS partnerId,
            p.name AS partnerName,
            os.name AS offeredSkillName, ws.name AS wantedSkillName
     FROM swap_requests sr
     JOIN skills os ON os.id = sr.offered_skill_id
     JOIN skills ws ON ws.id = sr.wanted_skill_id
     JOIN profiles p ON p.user_id = (CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END)
     WHERE sr.requester_id = ? OR sr.recipient_id = ?
     ORDER BY sr.created_at DESC`,
    [userId, userId, userId, userId, userId]
  );
  return rows;
}

async function getConversationIdForPair(userIdA, userIdB) {
  const [rows] = await pool.query(
    `SELECT id FROM conversations WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)`,
    [userIdA, userIdB, userIdB, userIdA]
  );
  return rows[0]?.id || null;
}

async function getPendingRequestBetween(userIdA, userIdB) {
  const [rows] = await pool.query(
    `SELECT id, requester_id AS requesterId, recipient_id AS recipientId
     FROM swap_requests
     WHERE status = 'pending' 
       AND ((requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?))
     ORDER BY created_at DESC LIMIT 1`,
    [userIdA, userIdB, userIdB, userIdA]
  );
  return rows[0] || null;
}

module.exports = {
  getSkillStatus, isUserLocked, hasDuplicatePendingRequest, isInTeachingCooldown,
  createSwapRequest, upsertConversation, getConversationIdForPair,
  getReceivedRequests, getSentRequests, getCompletedRequests, getFullHistory,
  getRequestForUpdate, areEitherLocked, acceptRequestTx, createLocksTx, autoCancelOtherPendingTx,
  rejectRequest, cancelRequest, getPendingRequestBetween
};