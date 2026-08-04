const pool = require('../../db/pool');

async function getConversationByPair(userIdA, userIdB) {
    const [rows] = await pool.query(
        `SELECT id, latest_swap_request_id AS latestSwapRequestId 
     FROM conversations 
     WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)`,
        [userIdA, userIdB, userIdB, userIdA]
    );
    return rows[0] || null;
}

async function getInbox(userId) {
  const [rows] = await pool.query(
    `SELECT c.id AS conversationId,
            CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END AS otherUserId,
            p.name AS otherUserName,
            (SELECT message FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS lastMessage,
            (SELECT created_at FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS lastMessageAt,
            EXISTS (
              SELECT 1 FROM chat_messages cm
              LEFT JOIN conversation_reads cr ON cr.conversation_id = cm.conversation_id AND cr.user_id = ?
              WHERE cm.conversation_id = c.id
                AND cm.sender_id != ?
                AND cm.created_at > COALESCE(cr.last_read_at, '1970-01-01')
            ) AS hasUnread
     FROM conversations c
     JOIN profiles p ON p.user_id = (CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END)
     WHERE c.user_a_id = ? OR c.user_b_id = ?
     ORDER BY COALESCE(lastMessageAt, c.created_at) DESC`,
    [userId, userId, userId, userId, userId, userId]
  );
  return rows;
}

async function getConversationParticipants(conversationId) {
    const [rows] = await pool.query(
        'SELECT user_a_id AS userAId, user_b_id AS userBId, latest_swap_request_id AS latestSwapRequestId FROM conversations WHERE id = ?',
        [conversationId]
    );
    return rows[0] || null;
}

async function getSwapStatus(swapRequestId) {
  if (!swapRequestId) return null;
  const [rows] = await pool.query(
    'SELECT status, completed_at AS completedAt FROM swap_requests WHERE id = ?',
    [swapRequestId]
  );
  return rows[0] || null;
}

async function getMessages(conversationId, beforeTimestamp = null) {
    const params = [conversationId];
    let query = `SELECT id, sender_id AS senderId, message_type AS messageType, message,
                      attachment_url AS attachmentUrl, attachment_name AS attachmentName, 
                      attachment_size AS attachmentSize, created_at AS createdAt
               FROM chat_messages WHERE conversation_id = ?`;

    if (beforeTimestamp) {
        query += ' AND created_at < ?';
        params.push(beforeTimestamp);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const [rows] = await pool.query(query, params);
    return rows.reverse(); // oldest-to-newest for display
}

async function insertMessage({ id, conversationId, senderId, messageType, message, attachmentUrl, attachmentName, attachmentSize }) {
    await pool.query(
        `INSERT INTO chat_messages (id, conversation_id, sender_id, message_type, message, attachment_url, attachment_name, attachment_size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, conversationId, senderId, messageType, message || null, attachmentUrl || null, attachmentName || null, attachmentSize || null]
    );
}

async function markConversationRead(conversationId, userId) {
  await pool.query(
    `INSERT INTO conversation_reads (conversation_id, user_id, last_read_at) VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE last_read_at = NOW()`,
    [conversationId, userId]
  );
}

async function getUnreadChatCount(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM chat_messages cm
     JOIN conversations c ON c.id = cm.conversation_id
     LEFT JOIN conversation_reads cr ON cr.conversation_id = cm.conversation_id AND cr.user_id = ?
     WHERE (c.user_a_id = ? OR c.user_b_id = ?)
       AND cm.sender_id != ?
       AND cm.created_at > COALESCE(cr.last_read_at, '1970-01-01')`,
    [userId, userId, userId, userId]
  );
  return rows[0].count;
}

module.exports = {
    getConversationByPair, getInbox, getConversationParticipants,
    getSwapStatus, getMessages, insertMessage, markConversationRead, getUnreadChatCount
};