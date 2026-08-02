const pool = require('../../db/pool');
const { v4: uuidv4 } = require('uuid');
const redis = require('../../config/redis');

async function hasCompletedSwap(userId) {
    const [rows] = await pool.query(
        `SELECT 1 FROM swap_requests WHERE (requester_id = ? OR recipient_id = ?) AND status = 'completed' LIMIT 1`,
        [userId, userId]
    );
    return rows.length > 0;
}

async function createProject({ userId, description, repoUrl }) {
    const projectId = uuidv4();
    await pool.query(
        'INSERT INTO projects (id, user_id, description, repo_url) VALUES (?, ?, ?, ?)',
        [projectId, userId, description, repoUrl || null]
    );
    return projectId;
}

async function addProjectImage(projectId, imageUrl) {
    await pool.query(
        'INSERT INTO project_images (id, project_id, image_url) VALUES (?, ?, ?)',
        [uuidv4(), projectId, imageUrl]
    );
}

async function addProjectTechnology(projectId, skillId) {
    await pool.query(
        'INSERT IGNORE INTO project_technologies (id, project_id, skill_id) VALUES (?, ?, ?)',
        [uuidv4(), projectId, skillId]
    );
}

async function getImageCount(projectId) {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM project_images WHERE project_id = ?', [projectId]);
    return rows[0].count;
}

async function getFeedPage({ skillId = null, cursorCreatedAt = null, cursorId = null, limit = 20 }) {
    let query = `
    SELECT p.id, p.description, p.repo_url AS repoUrl, p.created_at AS createdAt, 
           p.user_id AS userId, pr.name AS posterName
    FROM projects p
    JOIN profiles pr ON pr.user_id = p.user_id
  `;
    const params = [];

    if (skillId) {
        query += ` JOIN project_technologies pt ON pt.project_id = p.id AND pt.skill_id = ? `;
        params.push(skillId);
    }

    query += ` WHERE 1=1 `;

    if (cursorCreatedAt && cursorId) {
        query += ` AND (p.created_at < ? OR (p.created_at = ? AND p.id < ?)) `;
        params.push(cursorCreatedAt, cursorCreatedAt, cursorId);
    }

    query += ` ORDER BY p.created_at DESC, p.id DESC LIMIT ? `;
    params.push(limit);

    const [rows] = await pool.query(query, params);
    return rows;
}

async function getImagesForProjects(projectIds) {
    if (projectIds.length === 0) return [];
    const placeholders = projectIds.map(() => '?').join(',');
    const [rows] = await pool.query(
        `SELECT project_id AS projectId, image_url AS imageUrl FROM project_images WHERE project_id IN (${placeholders})`,
        projectIds
    );
    return rows;
}

async function getTechnologiesForProjects(projectIds) {
    if (projectIds.length === 0) return [];
    const placeholders = projectIds.map(() => '?').join(',');
    const [rows] = await pool.query(
        `SELECT pt.project_id AS projectId, s.id AS skillId, s.name AS skillName
     FROM project_technologies pt JOIN skills s ON s.id = pt.skill_id
     WHERE pt.project_id IN (${placeholders})`,
        projectIds
    );
    return rows;
}

async function getUserProjects(userId) {
    return getFeedPage({ limit: 100 }).then(() => null); // placeholder, replaced below properly
}

async function getProjectsByUser(userId) {
    const [rows] = await pool.query(
        `SELECT p.id, p.description, p.repo_url AS repoUrl, p.created_at AS createdAt, p.user_id AS userId
     FROM projects p WHERE p.user_id = ? ORDER BY p.created_at DESC, p.id DESC`,
        [userId]
    );
    return rows;
}

async function getUserKnownSkillBadges(userId, limit = 3) {
    const [rows] = await pool.query(
        `SELECT s.name FROM user_known_skills uks JOIN skills s ON s.id = uks.skill_id
     WHERE uks.user_id = ? AND uks.status = 'verified' LIMIT ?`,
        [userId, limit]
    );
    return rows.map(r => r.name);
}

const FEED_CACHE_KEY = 'feed:first-page';
const FEED_CACHE_TTL_SECONDS = 30; // short TTL — new posts should show up reasonably quickly

async function getCachedFirstPage() {
  try {
    const cached = await redis.get(FEED_CACHE_KEY);
    return cached || null; // Upstash returns the parsed object directly, or null if missing
  } catch (err) {
    console.warn('Redis read failed, falling back to database:', err.message);
    return null;
  }
}

async function setCachedFirstPage(data) {
  try {
    await redis.set(FEED_CACHE_KEY, data, { ex: FEED_CACHE_TTL_SECONDS }); // pass the object directly, Upstash handles serialization
  } catch (err) {
    console.warn('Redis write failed, continuing without cache:', err.message);
  }
}

async function invalidateFeedCache() {
  try {
    await redis.del(FEED_CACHE_KEY);
  } catch (err) {
    console.warn('Redis cache invalidation failed:', err.message);
  }
}

async function reportProject({ projectId, reporterId, reason }) {
  await pool.query(
    'INSERT INTO project_reports (id, project_id, reporter_id, reason, status) VALUES (?, ?, ?, ?, ?)',
    [uuidv4(), projectId, reporterId, reason, 'pending']
  );
}

module.exports = {
  hasCompletedSwap, createProject, addProjectImage, addProjectTechnology, getImageCount,
  getFeedPage, getImagesForProjects, getTechnologiesForProjects,
  getProjectsByUser, getUserKnownSkillBadges,
  getCachedFirstPage, setCachedFirstPage, invalidateFeedCache, reportProject
};