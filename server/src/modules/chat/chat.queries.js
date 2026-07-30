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
            (SELECT created_at FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS lastMessageAt
     FROM conversations c
     JOIN profiles p ON p.user_id = (CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END)
     WHERE c.user_a_id = ? OR c.user_b_id = ?
     ORDER BY COALESCE(lastMessageAt, c.created_at) DESC`,
        [userId, userId, userId, userId]
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
    const [rows] = await pool.query('SELECT status FROM swap_requests WHERE id = ?', [swapRequestId]);
    return rows[0]?.status || null;
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

module.exports = {
    getConversationByPair, getInbox, getConversationParticipants,
    getSwapStatus, getMessages, insertMessage
};