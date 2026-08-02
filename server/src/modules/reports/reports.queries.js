const pool = require('../../db/pool');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('../notifications/notifications.queries');

async function getSwapParticipants(swapId) {
    const [rows] = await pool.query(
        'SELECT requester_id AS requesterId, recipient_id AS recipientId FROM swap_requests WHERE id = ?',
        [swapId]
    );
    return rows[0] || null;
}

async function getConversationSwapId(conversationId) {
    const [rows] = await pool.query(
        'SELECT user_a_id AS userAId, user_b_id AS userBId, latest_swap_request_id AS swapId FROM conversations WHERE id = ?',
        [conversationId]
    );
    return rows[0] || null;
}

async function createReport({ reporterId, reportedUserId, swapRequestId, reason }) {
    await pool.query(
        'INSERT INTO reports (id, reporter_id, reported_user_id, swap_request_id, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), reporterId, reportedUserId, swapRequestId, reason, 'pending']
    );
}

async function getPendingReports() {
    const [rows] = await pool.query(
        `SELECT r.id, r.reason, r.created_at AS createdAt,
            reporter.name AS reporterName, reported.name AS reportedName, r.reported_user_id AS reportedUserId
     FROM reports r
     JOIN profiles reporter ON reporter.user_id = r.reporter_id
     JOIN profiles reported ON reported.user_id = r.reported_user_id
     WHERE r.status = 'pending'
     ORDER BY r.created_at ASC`
    );
    return rows;
}

async function dismissReport(reportId) {
    await pool.query(`UPDATE reports SET status = 'dismissed', reviewed_at = NOW() WHERE id = ?`, [reportId]);
}

async function issueWarning({ reportId, userId, message, issuedBy }) {
  await pool.query(
    'INSERT INTO warnings (id, user_id, report_id, message, issued_by) VALUES (?, ?, ?, ?, ?)',
    [uuidv4(), userId, reportId, message, issuedBy]
  );
  await pool.query(`UPDATE reports SET status = 'warned', reviewed_at = NOW() WHERE id = ?`, [reportId]);
  await createNotification({ userId, type: 'account_warning', message: `Warning: ${message}` });
}

async function tempBanUser({ reportId, userId, days }) {
  await pool.query(
    `UPDATE users SET account_status = 'temp_banned', temp_ban_until = NOW() + INTERVAL ? DAY WHERE id = ?`,
    [days, userId]
  );
  await pool.query(`UPDATE reports SET status = 'temp_banned', reviewed_at = NOW() WHERE id = ?`, [reportId]);
  await createNotification({ userId, type: 'account_warning', message: `Your account has been temporarily suspended for ${days} days.` });
  await releaseActiveLockAndCancelSwap(userId);
}

async function permanentBanUser({ reportId, userId }) {
  await pool.query(
    `UPDATE users SET account_status = 'permanently_banned', temp_ban_until = NULL WHERE id = ?`,
    [userId]
  );
  await pool.query(`UPDATE reports SET status = 'permanently_banned', reviewed_at = NOW() WHERE id = ?`, [reportId]);
  await pool.query(
    `UPDATE reports SET status = 'permanently_banned', reviewed_at = NOW() WHERE reported_user_id = ? AND status = 'pending'`,
    [userId]
  );
  await createNotification({ userId, type: 'account_warning', message: `Your account has been permanently banned.` });
  await releaseActiveLockAndCancelSwap(userId);
}

async function releaseActiveLockAndCancelSwap(userId) {
    const [locks] = await pool.query('SELECT locked_by_swap_id AS swapId FROM user_locks WHERE user_id = ?', [userId]);
    if (locks.length === 0) return;

    const swapId = locks[0].swapId;
    const [swapRows] = await pool.query(
        'SELECT requester_id AS requesterId, recipient_id AS recipientId FROM swap_requests WHERE id = ?',
        [swapId]
    );
    if (swapRows.length === 0) return;

    await pool.query(`UPDATE swap_requests SET status = 'cancelled', updated_at = NOW() WHERE id = ?`, [swapId]);
    await pool.query('DELETE FROM user_locks WHERE user_id IN (?, ?)', [swapRows[0].requesterId, swapRows[0].recipientId]);
}

async function getHandledReports() {
  const [rows] = await pool.query(
    `SELECT r.id, r.reason, r.status, r.created_at AS createdAt, r.reviewed_at AS reviewedAt,
            reporter.name AS reporterName, reported.name AS reportedName, r.reported_user_id AS reportedUserId
     FROM reports r
     JOIN profiles reporter ON reporter.user_id = r.reporter_id
     JOIN profiles reported ON reported.user_id = r.reported_user_id
     WHERE r.status != 'pending'
     ORDER BY r.reviewed_at DESC`
  );
  return rows;
}

async function hasAnyReportBetween(userIdA, userIdB) {
  const [rows] = await pool.query(
    `SELECT id FROM reports 
     WHERE (reporter_id = ? AND reported_user_id = ?) OR (reporter_id = ? AND reported_user_id = ?)
     LIMIT 1`,
    [userIdA, userIdB, userIdB, userIdA]
  );
  return rows.length > 0;
}

async function terminateActiveSwapBetween(userIdA, userIdB) {
  const [rows] = await pool.query(
    `SELECT id, status FROM swap_requests 
     WHERE ((requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?))
       AND status IN ('pending', 'accepted', 'in_progress')`,
    [userIdA, userIdB, userIdB, userIdA]
  );

  for (const row of rows) {
    await pool.query(`UPDATE swap_requests SET status = 'cancelled', updated_at = NOW() WHERE id = ?`, [row.id]);
    // only locked swaps (accepted/in_progress) actually have lock rows to clean up —
    // deleting from user_locks for a pending swap is harmless (no matching rows exist), so this stays safe either way
    await pool.query('DELETE FROM user_locks WHERE user_id IN (?, ?)', [userIdA, userIdB]);
  }

  return rows.length > 0;
}

module.exports = {
    getSwapParticipants, getConversationSwapId, createReport,
    getPendingReports, dismissReport, issueWarning, tempBanUser, permanentBanUser,
    getHandledReports, hasAnyReportBetween, terminateActiveSwapBetween
};