const pool = require('../../db/pool');

async function getExpiredPendingRequests() {
    const [rows] = await pool.query(
        `SELECT id, requester_id AS requesterId, recipient_id AS recipientId
     FROM swap_requests
     WHERE status = 'pending' AND created_at < NOW() - INTERVAL 7 DAY`
    );
    return rows;
}

async function cancelExpiredRequest(id) {
    await pool.query(
        `UPDATE swap_requests SET status = 'cancelled', updated_at = NOW() WHERE id = ? AND status = 'pending'`,
        [id]
    );
}

module.exports = { getExpiredPendingRequests, cancelExpiredRequest };