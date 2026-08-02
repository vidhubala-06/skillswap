const pool = require('../../db/pool');

async function getDashboardStats() {
    const [[userCount]] = await pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'user'`);
    const [swapsByStatus] = await pool.query(`SELECT status, COUNT(*) AS count FROM swap_requests GROUP BY status`);
    const [[skillCount]] = await pool.query('SELECT COUNT(*) AS count FROM skills');
    const [[pendingSuggestions]] = await pool.query(`SELECT COUNT(*) AS count FROM skill_suggestions WHERE status = 'pending'`);
    const [[quizStats]] = await pool.query(
        `SELECT COUNT(*) AS total, SUM(CASE WHEN passed THEN 1 ELSE 0 END) AS passed FROM quiz_attempts`
    );
    const [[pendingReports]] = await pool.query(`SELECT COUNT(*) AS count FROM reports WHERE status = 'pending'`);

    return {
        totalUsers: userCount.count,
        swapsByStatus,
        totalSkills: skillCount.count,
        pendingSuggestions: pendingSuggestions.count,
        quizTotal: quizStats.total,
        quizPassed: quizStats.passed || 0,
        pendingReports: pendingReports.count
    };
}

async function getPendingSuggestions() {
  const [rows] = await pool.query(
    `SELECT ss.id, ss.suggested_name AS suggestedName, ss.request_count AS requestCount, 
            ss.created_at AS createdAt, p.name AS submittedByName
     FROM skill_suggestions ss
     JOIN profiles p ON p.user_id = ss.submitted_by
     WHERE ss.status = 'pending'
     ORDER BY ss.request_count DESC, ss.created_at ASC`
  );
  return rows;
}

async function createSkillDirect({ name, normalizedName, createdBy }) {
  const [result] = await pool.query(
    'INSERT INTO skills (name, normalized_name, created_by) VALUES (?, ?, ?)',
    [name, normalizedName, createdBy]
  );
  return result.insertId;
}

async function markSuggestionHandled(suggestionId, resultingSkillId) {
  await pool.query(
    `UPDATE skill_suggestions SET status = 'handled', resulting_skill_id = ?, reviewed_at = NOW() WHERE id = ?`,
    [resultingSkillId, suggestionId]
  );
}

async function dismissSuggestion(suggestionId) {
  await pool.query(
    `UPDATE skill_suggestions SET status = 'dismissed', reviewed_at = NOW() WHERE id = ?`,
    [suggestionId]
  );
}

async function getAllSkills() {
  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.created_at AS createdAt, p.name AS addedByName
     FROM skills s
     LEFT JOIN profiles p ON p.user_id = s.created_by
     ORDER BY s.created_at DESC`
  );
  return rows;
}

async function getUsersList({ search = '', limit = 20, offset = 0 }) {
  const searchPattern = `%${search}%`;
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.email_verified AS emailVerified, u.account_status AS accountStatus,
            u.created_at AS createdAt, p.name
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.role = 'user' AND (p.name LIKE ? OR u.email LIKE ?)
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [searchPattern, searchPattern, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.role = 'user' AND (p.name LIKE ? OR u.email LIKE ?)`,
    [searchPattern, searchPattern]
  );

  return { users: rows, total };
}

async function getUserDetail(userId) {
  const [profileRows] = await pool.query(
    `SELECT u.email, u.email_verified AS emailVerified, u.account_status AS accountStatus, 
            u.created_at AS joinedAt, p.name, p.linkedin_url AS linkedinUrl, p.github_url AS githubUrl, p.experience
     FROM users u LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );
  if (profileRows.length === 0) return null;

  const [knownSkills] = await pool.query(
    `SELECT s.name, uks.status, uks.self_rating AS selfRating, uks.best_quiz_score AS bestQuizScore
     FROM user_known_skills uks JOIN skills s ON s.id = uks.skill_id WHERE uks.user_id = ?`,
    [userId]
  );

  const [wantedSkills] = await pool.query(
    `SELECT s.name FROM user_wanted_skills uws JOIN skills s ON s.id = uws.skill_id WHERE uws.user_id = ?`,
    [userId]
  );

  const [quizAttempts] = await pool.query(
    `SELECT s.name AS skillName, qa.score, qa.total_marks AS totalMarks, qa.passed, qa.attempted_at AS attemptedAt
     FROM quiz_attempts qa JOIN skills s ON s.id = qa.skill_id
     WHERE qa.user_id = ? ORDER BY qa.attempted_at DESC`,
    [userId]
  );

  const [swapHistory] = await pool.query(
    `SELECT sr.id, sr.status, sr.created_at AS createdAt, sr.completed_at AS completedAt,
            CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END AS partnerId,
            p.name AS partnerName
     FROM swap_requests sr
     JOIN profiles p ON p.user_id = (CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END)
     WHERE sr.requester_id = ? OR sr.recipient_id = ?
     ORDER BY sr.created_at DESC`,
    [userId, userId, userId, userId]
  );

  const [warnings] = await pool.query(
    `SELECT message, created_at AS createdAt FROM warnings WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return {
    profile: profileRows[0],
    knownSkills,
    wantedSkills,
    quizAttempts,
    swapHistory,
    warnings
  };
}

async function getAllProjectsForAdmin() {
  const [rows] = await pool.query(
    `SELECT p.id, p.description, p.repo_url AS repoUrl, p.created_at AS createdAt,
            pr.name AS posterName, p.user_id AS userId
     FROM projects p
     JOIN profiles pr ON pr.user_id = p.user_id
     ORDER BY p.created_at DESC`
  );
  return rows;
}

async function deleteProjectAdmin(projectId) {
  await pool.query('DELETE FROM projects WHERE id = ?', [projectId]);
}

async function getPendingProjectReports() {
  const [rows] = await pool.query(
    `SELECT pr.id, pr.reason, pr.created_at AS createdAt, p.description, p.id AS projectId,
            reporter.name AS reporterName, poster.name AS posterName
     FROM project_reports pr
     JOIN projects p ON p.id = pr.project_id
     JOIN profiles reporter ON reporter.user_id = pr.reporter_id
     JOIN profiles poster ON poster.user_id = p.user_id
     WHERE pr.status = 'pending'
     ORDER BY pr.created_at ASC`
  );
  return rows;
}

async function dismissProjectReport(id) {
  await pool.query(`UPDATE project_reports SET status = 'dismissed' WHERE id = ?`, [id]);
}

module.exports = { 
  getDashboardStats, getPendingSuggestions, createSkillDirect, 
  markSuggestionHandled, dismissSuggestion, getAllSkills, getUsersList,
  getUserDetail, getAllProjectsForAdmin, deleteProjectAdmin,
  getPendingProjectReports, dismissProjectReport
};