const pool = require('../../db/pool');
const { v4: uuidv4 } = require('uuid');

async function upsertCooldown({ userId, skillId, taughtToUserId, cooldownUntil }) {
  await pool.query(
    `INSERT INTO skill_cooldowns (id, user_id, skill_id, last_taught_to_user_id, cooldown_until)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       cooldown_until = VALUES(cooldown_until),
       last_taught_to_user_id = VALUES(last_taught_to_user_id),
       created_at = CURRENT_TIMESTAMP`,
    [uuidv4(), userId, skillId, taughtToUserId, cooldownUntil]
  );
}
async function getTeachingCooldowns(userId) {
  const [rows] = await pool.query(
    `SELECT sc.skill_id AS skillId, s.name AS skillName, sc.cooldown_until AS cooldownUntil
     FROM skill_cooldowns sc
     JOIN skills s ON s.id = sc.skill_id
     WHERE sc.user_id = ?
     ORDER BY s.name ASC`,
    [userId]
  );
  return rows;
}

async function updateTeachingCooldown(userId, skillId, cooldownUntil) {
  const [result] = await pool.query(
    `UPDATE skill_cooldowns SET cooldown_until = ? WHERE user_id = ? AND skill_id = ?`,
    [cooldownUntil, userId, skillId]
  );
  return result.affectedRows > 0;
}

module.exports = { upsertCooldown, getTeachingCooldowns, updateTeachingCooldown };