const pool = require('../../db/pool');
const { v4: uuidv4 } = require('uuid');
const { getIO } = require('../../socket');

async function createNotification({ userId, type, message, relatedSwapId = null }) {
  const id = uuidv4();
  await pool.query(
    'INSERT INTO notifications (id, user_id, type, message, related_swap_id) VALUES (?, ?, ?, ?, ?)',
    [id, userId, type, message, relatedSwapId]
  );

  getIO().to(userId).emit('notification:new', { id, type, message, relatedSwapId, isRead: false, createdAt: new Date().toISOString() });
}

async function getNotifications(userId) {
    const [rows] = await pool.query(
        `SELECT id, type, message, related_swap_id AS relatedSwapId, is_read AS isRead, created_at AS createdAt
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
        [userId]
    );
    return rows;
}

async function markRead(notificationId, userId) {
    await pool.query(
        'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
        [notificationId, userId]
    );
}

async function markAllRead(userId) {
    await pool.query(
        'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false',
        [userId]
    );
}

async function getUnreadCount(userId) {
    const [rows] = await pool.query(
        'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = false',
        [userId]
    );
    return rows[0].count;
}

module.exports = { createNotification, getNotifications, markRead, markAllRead, getUnreadCount };