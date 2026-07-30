const pool = require('../../db/pool');
const { v4: uuidv4 } = require('uuid');

async function getSwapDetails(swapId, userId) {
  const [rows] = await pool.query(
    `SELECT sr.id, sr.status, sr.session_date AS sessionDate, sr.session_time AS sessionTime,
            sr.requester_marked_complete AS requesterMarkedComplete,
            sr.recipient_marked_complete AS recipientMarkedComplete,
            sr.requester_id AS requesterId, sr.recipient_id AS recipientId,
            os.name AS offeredSkillName, os.id AS offeredSkillId,
            ws.name AS wantedSkillName, ws.id AS wantedSkillId,
            p.name AS partnerName
     FROM swap_requests sr
     JOIN skills os ON os.id = sr.offered_skill_id
     JOIN skills ws ON ws.id = sr.wanted_skill_id
     JOIN profiles p ON p.user_id = (CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END)
     WHERE sr.id = ? AND (sr.requester_id = ? OR sr.recipient_id = ?)`,
    [userId, swapId, userId, userId]
  );
  return rows[0] || null;
}

async function scheduleSession(swapId, { sessionDate, sessionTime, scheduledBy }) {
  const [result] = await pool.query(
    `UPDATE swap_requests 
     SET session_date = ?, session_time = ?, status = 'in_progress', updated_at = NOW(),
         day_reminder_sent = false, hour_reminder_sent = false
     WHERE id = ? AND status IN ('accepted', 'in_progress')`,
    [sessionDate, sessionTime, swapId]
  );

  if (result.affectedRows > 0) {
    await pool.query(
      `INSERT INTO swap_sessions (id, swap_request_id, session_date, session_time, scheduled_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), swapId, sessionDate, sessionTime, scheduledBy]
    );
  }

  return result.affectedRows > 0;
}

async function getSessionHistory(swapId) {
  const [rows] = await pool.query(
    `SELECT ss.session_date AS sessionDate, ss.session_time AS sessionTime, ss.created_at AS scheduledAt, p.name AS scheduledByName
     FROM swap_sessions ss
     JOIN profiles p ON p.user_id = ss.scheduled_by
     WHERE ss.swap_request_id = ?
     ORDER BY ss.created_at ASC`,
    [swapId]
  );
  return rows;
}

async function markComplete(swapId, userId, isRequester) {
  const column = isRequester ? 'requester_marked_complete' : 'recipient_marked_complete';
  await pool.query(
    `UPDATE swap_requests SET ${column} = true WHERE id = ? AND status = 'in_progress'`,
    [swapId]
  );
}

async function getCompletionFlags(swapId) {
  const [rows] = await pool.query(
    `SELECT requester_marked_complete AS requesterMarkedComplete, 
            recipient_marked_complete AS recipientMarkedComplete,
            requester_id AS requesterId, recipient_id AS recipientId,
            session_date AS sessionDate, session_time AS sessionTime
     FROM swap_requests WHERE id = ?`,
    [swapId]
  );
  return rows[0] || null;
}

async function completeSwapTx(connection, swapId, { requesterId, recipientId }) {
  await connection.query(
    `UPDATE swap_requests SET status = 'completed', completed_at = NOW() WHERE id = ?`,
    [swapId]
  );
  await connection.query(
    `DELETE FROM user_locks WHERE user_id IN (?, ?)`,
    [requesterId, recipientId]
  );
}

async function getOrCreateMeetingRoom(swapId) {
  const [rows] = await pool.query('SELECT meeting_room_id AS roomId FROM swap_requests WHERE id = ?', [swapId]);
  if (rows.length === 0) return null;

  if (rows[0].roomId) {
    return rows[0].roomId;
  }

  const newRoomId = `skillswap-${uuidv4()}`;
  await pool.query('UPDATE swap_requests SET meeting_room_id = ? WHERE id = ?', [newRoomId, swapId]);
  return newRoomId;
}

module.exports = {
  getSwapDetails, scheduleSession, getSessionHistory, markComplete, getCompletionFlags, completeSwapTx, getOrCreateMeetingRoom
};