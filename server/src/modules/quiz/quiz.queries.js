const pool = require('../../db/pool');

async function insertQuizQuestion({ id, skillId, question, options, correctOptionId }) {
  await pool.query(
    'INSERT INTO quiz_questions (id, skill_id, question, options, correct_option_id) VALUES (?, ?, ?, ?, ?)',
    [id, skillId, question, JSON.stringify(options), correctOptionId]
  );
}

async function getQuestionCountForSkill(skillId) {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM quiz_questions WHERE skill_id = ?', [skillId]);
  return rows[0].count;
}

async function getKnownSkillsWithStatus(userId) {
  const [rows] = await pool.query(
    `SELECT uks.skill_id, s.name, uks.status, uks.cooldown_until, uks.self_rating, uks.best_quiz_score
     FROM user_known_skills uks
     JOIN skills s ON s.id = uks.skill_id
     WHERE uks.user_id = ?
     ORDER BY 
       CASE uks.status 
         WHEN 'pending_quiz' THEN 0 
         WHEN 'cooldown' THEN 1 
         WHEN 'verified' THEN 2 
       END, s.name ASC`,
    [userId]
  );
  return rows;
}

async function getKnownSkillStatus(userId, skillId) {
  const [rows] = await pool.query(
    'SELECT status, cooldown_until FROM user_known_skills WHERE user_id = ? AND skill_id = ?',
    [userId, skillId]
  );
  return rows[0] || null;
}

async function getRandomQuestionsForSkill(skillId, count = 25) {
  const [rows] = await pool.query(
    'SELECT id, question, options, correct_option_id FROM quiz_questions WHERE skill_id = ? ORDER BY RAND() LIMIT ?',
    [skillId, count]
  );
  return rows;
}

async function createQuizSession({ id, userId, skillId, questionsJson, expiresAt }) {
  await pool.query(
    'INSERT INTO quiz_sessions (id, user_id, skill_id, questions_json, expires_at) VALUES (?, ?, ?, ?, ?)',
    [id, userId, skillId, JSON.stringify(questionsJson), expiresAt]
  );
}

async function getQuizSession(sessionId, userId) {
  const [rows] = await pool.query(
    'SELECT * FROM quiz_sessions WHERE id = ? AND user_id = ?',
    [sessionId, userId]
  );
  return rows[0] || null;
}

async function markSessionSubmitted(sessionId) {
  await pool.query(`UPDATE quiz_sessions SET status = 'submitted' WHERE id = ?`, [sessionId]);
}

async function insertQuizAttempt({ id, userId, skillId, score, totalMarks, passed }) {
  await pool.query(
    'INSERT INTO quiz_attempts (id, user_id, skill_id, score, total_marks, passed) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, skillId, score, totalMarks, passed]
  );
}

async function markSkillVerified({ userId, skillId, score }) {
  await pool.query(
    `UPDATE user_known_skills 
     SET status = 'verified', best_quiz_score = ?, verified_at = NOW() 
     WHERE user_id = ? AND skill_id = ?`,
    [score, userId, skillId]
  );
}

async function markSkillCooldown({ userId, skillId }) {
  await pool.query(
    `UPDATE user_known_skills 
     SET status = 'cooldown', cooldown_until = NOW() + INTERVAL 24 HOUR 
     WHERE user_id = ? AND skill_id = ?`,
    [userId, skillId]
  );
}

module.exports = {
  insertQuizQuestion,
  getQuestionCountForSkill,
  getKnownSkillsWithStatus,
  getKnownSkillStatus,
  getRandomQuestionsForSkill,
  createQuizSession,
  getQuizSession,
  markSessionSubmitted,
  insertQuizAttempt,
  markSkillVerified,
  markSkillCooldown
};