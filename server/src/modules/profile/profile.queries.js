const pool = require('../../db/pool');

async function upsertProfile({ userId, name, linkedinUrl, githubUrl, experience }) {
  await pool.query(
    `INSERT INTO profiles (user_id, name, linkedin_url, github_url, experience)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
       name = VALUES(name), 
       linkedin_url = VALUES(linkedin_url),
       github_url = VALUES(github_url), 
       experience = VALUES(experience)`,
    [userId, name, linkedinUrl || null, githubUrl || null, experience || null]
  );
}

async function getProfile(userId) {
  const [rows] = await pool.query(
    'SELECT name, linkedin_url, github_url, experience FROM profiles WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

async function getPublicProfile(userId) {
  const [profileRows] = await pool.query(
    'SELECT p.name, p.linkedin_url AS linkedinUrl, p.github_url AS githubUrl, p.experience FROM profiles p WHERE p.user_id = ?',
    [userId]
  );
  if (profileRows.length === 0) return null;

  const [knownSkills] = await pool.query(
    `SELECT s.id, s.name, uks.self_rating AS selfRating
     FROM user_known_skills uks
     JOIN skills s ON s.id = uks.skill_id
     WHERE uks.user_id = ? AND uks.status = 'verified'`,
    [userId]
  );

  const [wantedSkills] = await pool.query(
    `SELECT s.id, s.name
     FROM user_wanted_skills uws
     JOIN skills s ON s.id = uws.skill_id
     WHERE uws.user_id = ?`,
    [userId]
  );

  return { profile: profileRows[0], knownSkills, wantedSkills };
}

async function getKnownSkillIds(userId) {
  const [rows] = await pool.query('SELECT skill_id FROM user_known_skills WHERE user_id = ?', [userId]);
  return rows.map((r) => r.skill_id);
}

async function getKnownSkillsFull(userId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.name, uks.status, uks.cooldown_until 
     FROM user_known_skills uks 
     JOIN skills s ON s.id = uks.skill_id 
     WHERE uks.user_id = ?`,
    [userId]
  );
  return rows;
}

async function getWantedSkillIds(userId) {
  const [rows] = await pool.query('SELECT skill_id FROM user_wanted_skills WHERE user_id = ?', [userId]);
  return rows.map((r) => r.skill_id);
}

async function getWantedSkillsFull(userId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.name 
     FROM user_wanted_skills uws 
     JOIN skills s ON s.id = uws.skill_id 
     WHERE uws.user_id = ?`,
    [userId]
  );
  return rows;
}

async function insertKnownSkill({ id, userId, skillId }) {
  await pool.query(
    `INSERT IGNORE INTO user_known_skills (id, user_id, skill_id, status) VALUES (?, ?, ?, 'pending_quiz')`,
    [id, userId, skillId]
  );
}

async function insertWantedSkill({ id, userId, skillId }) {
  await pool.query(
    `INSERT IGNORE INTO user_wanted_skills (id, user_id, skill_id) VALUES (?, ?, ?)`,
    [id, userId, skillId]
  );
}

async function removeKnownSkillsNotIn(userId, keepIds) {
  if (keepIds.length === 0) {
    await pool.query('DELETE FROM user_known_skills WHERE user_id = ?', [userId]);
    return;
  }
  const placeholders = keepIds.map(() => '?').join(',');
  await pool.query(
    `DELETE FROM user_known_skills WHERE user_id = ? AND skill_id NOT IN (${placeholders})`,
    [userId, ...keepIds]
  );
}

async function removeWantedSkillsNotIn(userId, keepIds) {
  if (keepIds.length === 0) {
    await pool.query('DELETE FROM user_wanted_skills WHERE user_id = ?', [userId]);
    return;
  }
  const placeholders = keepIds.map(() => '?').join(',');
  await pool.query(
    `DELETE FROM user_wanted_skills WHERE user_id = ? AND skill_id NOT IN (${placeholders})`,
    [userId, ...keepIds]
  );
}

async function getPendingQuizSkillIds(userId) {
  const [rows] = await pool.query(
    `SELECT skill_id FROM user_known_skills WHERE user_id = ? AND status = 'pending_quiz'`,
    [userId]
  );
  return rows.map((r) => r.skill_id);
}

async function updateSelfRating(userId, skillId, rating) {
  await pool.query(
    `UPDATE user_known_skills SET self_rating = ? WHERE user_id = ? AND skill_id = ? AND status = 'verified'`,
    [rating, userId, skillId]
  );
}

async function getVerifiedCount(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM user_known_skills WHERE user_id = ? AND status = 'verified'`,
    [userId]
  );
  return rows[0].count;
}

module.exports = {
  upsertProfile, getKnownSkillIds, getWantedSkillIds,
  insertKnownSkill, insertWantedSkill,
  removeKnownSkillsNotIn, removeWantedSkillsNotIn,
  getPendingQuizSkillIds, updateSelfRating,
  getProfile, getPublicProfile, getKnownSkillsFull, getWantedSkillsFull, getVerifiedCount
};