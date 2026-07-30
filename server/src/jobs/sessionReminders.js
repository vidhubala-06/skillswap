const pool = require('../db/pool');
const { sendSessionReminderEmail } = require('../config/resend');

async function checkDayOfReminders() {
    const [swaps] = await pool.query(
        `SELECT sr.id, sr.session_date AS sessionDate, sr.session_time AS sessionTime,
            requester.email AS requesterEmail, recipient.email AS recipientEmail,
            rp.name AS requesterName, cp.name AS recipientName
     FROM swap_requests sr
     JOIN users requester ON requester.id = sr.requester_id
     JOIN users recipient ON recipient.id = sr.recipient_id
     JOIN profiles rp ON rp.user_id = sr.requester_id
     JOIN profiles cp ON cp.user_id = sr.recipient_id
     WHERE sr.status = 'in_progress' 
       AND sr.session_date = CURDATE() 
       AND sr.day_reminder_sent = false`
    );

    for (const swap of swaps) {
        try {
            await sendSessionReminderEmail(swap.requesterEmail, swap.recipientName, swap.sessionDate, swap.sessionTime, 24);
            await sendSessionReminderEmail(swap.recipientEmail, swap.requesterName, swap.sessionDate, swap.sessionTime, 24);
            await pool.query('UPDATE swap_requests SET day_reminder_sent = true WHERE id = ?', [swap.id]);
            console.log(`Day-of reminder sent for swap ${swap.id}`);
        } catch (err) {
            console.error(`Failed to send day-of reminder for swap ${swap.id}:`, err.message);
        }
    }
}

async function checkHourBeforeReminders() {
    const [swaps] = await pool.query(
        `SELECT sr.id, sr.session_date AS sessionDate, sr.session_time AS sessionTime,
            requester.email AS requesterEmail, recipient.email AS recipientEmail,
            rp.name AS requesterName, cp.name AS recipientName
     FROM swap_requests sr
     JOIN users requester ON requester.id = sr.requester_id
     JOIN users recipient ON recipient.id = sr.recipient_id
     JOIN profiles rp ON rp.user_id = sr.requester_id
     JOIN profiles cp ON cp.user_id = sr.recipient_id
     WHERE sr.status = 'in_progress'
       AND TIMESTAMP(sr.session_date, sr.session_time) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 65 MINUTE)
       AND TIMESTAMP(sr.session_date, sr.session_time) > DATE_ADD(NOW(), INTERVAL 55 MINUTE)
       AND sr.hour_reminder_sent = false`
    );

    for (const swap of swaps) {
        try {
            await sendSessionReminderEmail(swap.requesterEmail, swap.recipientName, swap.sessionDate, swap.sessionTime, 1);
            await sendSessionReminderEmail(swap.recipientEmail, swap.requesterName, swap.sessionDate, swap.sessionTime, 1);
            await pool.query('UPDATE swap_requests SET hour_reminder_sent = true WHERE id = ?', [swap.id]);
            console.log(`Hour-before reminder sent for swap ${swap.id}`);
        } catch (err) {
            console.error(`Failed to send hour-before reminder for swap ${swap.id}:`, err.message);
        }
    }
}

async function runReminderCheck() {
    await checkDayOfReminders();
    await checkHourBeforeReminders();
}

module.exports = { runReminderCheck };