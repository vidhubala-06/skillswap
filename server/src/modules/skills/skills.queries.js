const pool = require('../../db/pool');

async function searchSkills(query) {
  const [rows] = await pool.query(
    `SELECT id, name FROM skills
     WHERE name LIKE CONCAT(?, '%') OR name LIKE CONCAT('%', ?, '%')
     ORDER BY CASE WHEN name LIKE CONCAT(?, '%') THEN 0 ELSE 1 END, name ASC
     LIMIT 15`,
    [query, query, query]
  );
  return rows;
}

async function findSkillsByIds(ids) {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id FROM skills WHERE id IN (${placeholders})`,
    ids
  );
  return rows;
}

async function findSkillByNormalizedName(normalizedName) {
  const [rows] = await pool.query(
    'SELECT id, name FROM skills WHERE normalized_name = ?',
    [normalizedName]
  );
  return rows[0] || null;
}

async function findPendingSuggestion(normalizedName) {
  const [rows] = await pool.query(
    'SELECT id, request_count FROM skill_suggestions WHERE normalized_name = ? AND status = ?',
    [normalizedName, 'pending']
  );
  return rows[0] || null;
}

async function incrementSuggestionCount(id) {
  await pool.query('UPDATE skill_suggestions SET request_count = request_count + 1 WHERE id = ?', [id]);
}

async function createSuggestion({ id, suggestedName, normalizedName, submittedBy }) {
  await pool.query(
    'INSERT INTO skill_suggestions (id, suggested_name, normalized_name, submitted_by, status, request_count) VALUES (?, ?, ?, ?, ?, ?)',
    [id, suggestedName, normalizedName, submittedBy, 'pending', 1]
  );
}

module.exports = { 
  searchSkills, findSkillsByIds, findSkillByNormalizedName,
  findPendingSuggestion, incrementSuggestionCount, createSuggestion 
};