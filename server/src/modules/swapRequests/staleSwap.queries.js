const pool = require('../../db/pool');

async function getStaleActiveSwaps() {
    const [rows] = await pool.query(
        `SELECT id, requester_id AS requesterId, recipient_id AS recipientId
     FROM swap_requests
     WHERE status = 'in_progress' 
       AND session_date < DATE_SUB(CURDATE(), INTERVAL 15 DAY)`
    );
    return rows;
}

async function releaseStaleSwap(id, requesterId, recipientId) {
  await pool.query(
    `UPDATE swap_requests SET status = 'cancelled', updated_at = NOW() WHERE id = ? AND status IN ('in_progress', 'accepted')`,
    [id]
  );
  await pool.query('DELETE FROM user_locks WHERE user_id IN (?, ?)', [requesterId, recipientId]);
}
async function getStaleUnscheduledSwaps() {
  const [rows] = await pool.query(
    `SELECT id, requester_id AS requesterId, recipient_id AS recipientId
     FROM swap_requests
     WHERE status = 'accepted' 
       AND session_date IS NULL
       AND updated_at < DATE_SUB(NOW(), INTERVAL 5 DAY)`
  );
  return rows;
}

module.exports = { getStaleActiveSwaps, releaseStaleSwap, getStaleUnscheduledSwaps };