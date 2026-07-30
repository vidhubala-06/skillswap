const pool = require('../../db/pool');

async function findTwoWayMatches({ wantedSkillId, myUserId }) {
  const [rows] = await pool.query(
    `SELECT DISTINCT u.id AS matchedUserId, p.name, p.linkedin_url AS linkedinUrl, p.github_url AS githubUrl,
            uks.skill_id AS matchedKnownSkillId, s.name AS skillName, uks.self_rating AS selfRating
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     JOIN user_known_skills uks ON uks.user_id = u.id
     JOIN skills s ON s.id = uks.skill_id
     WHERE
       uks.skill_id = ?
       AND uks.status = 'verified'
       AND (uks.cooldown_until IS NULL OR uks.cooldown_until < NOW())
       AND u.id != ?
       AND u.account_status = 'active'
       AND u.id NOT IN (SELECT user_id FROM user_locks)
       AND NOT EXISTS (
         SELECT 1 FROM skill_cooldowns sc
         WHERE sc.user_id = u.id AND sc.skill_id = uks.skill_id
           AND sc.cooldown_until IS NOT NULL AND sc.cooldown_until > NOW()
       )
       AND EXISTS (
         SELECT 1 FROM user_wanted_skills uws
         JOIN user_known_skills my_known ON my_known.skill_id = uws.skill_id
           AND my_known.user_id = ? AND my_known.status = 'verified'
         WHERE uws.user_id = u.id
       )
     ORDER BY RAND()`,
    [wantedSkillId, myUserId, myUserId]
  );
  return rows;
}

async function findFallbackMatches({ wantedSkillId, myUserId }) {
  const [rows] = await pool.query(
    `SELECT DISTINCT u.id AS matchedUserId, p.name, p.linkedin_url AS linkedinUrl, p.github_url AS githubUrl,
            uks.skill_id AS matchedKnownSkillId, s.name AS skillName, uks.self_rating AS selfRating
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     JOIN user_known_skills uks ON uks.user_id = u.id
     JOIN skills s ON s.id = uks.skill_id
     WHERE
       uks.skill_id = ?
       AND uks.status = 'verified'
       AND (uks.cooldown_until IS NULL OR uks.cooldown_until < NOW())
       AND u.id != ?
       AND u.account_status = 'active'
       AND u.id NOT IN (SELECT user_id FROM user_locks)
       AND NOT EXISTS (
         SELECT 1 FROM skill_cooldowns sc
         WHERE sc.user_id = u.id AND sc.skill_id = uks.skill_id
           AND sc.cooldown_until IS NOT NULL AND sc.cooldown_until > NOW()
       )
     ORDER BY RAND()`,
    [wantedSkillId, myUserId]
  );
  return rows;
}

module.exports = { findTwoWayMatches, findFallbackMatches };