const pool = require('../../db/pool');

async function getDashboardData(userId) {
  const [profileRows] = await pool.query('SELECT name FROM profiles WHERE user_id = ?', [userId]);

  const [skillCounts] = await pool.query(
    `SELECT 
       SUM(CASE WHEN status='verified' THEN 1 ELSE 0 END) AS verified,
       SUM(CASE WHEN status='pending_quiz' THEN 1 ELSE 0 END) AS pendingQuiz,
       SUM(CASE WHEN status='cooldown' THEN 1 ELSE 0 END) AS cooldown
     FROM user_known_skills WHERE user_id = ?`,
    [userId]
  );

  const [wantedCountRows] = await pool.query(
    'SELECT COUNT(*) AS count FROM user_wanted_skills WHERE user_id = ?',
    [userId]
  );

  const [lockRows] = await pool.query(
    'SELECT locked_by_swap_id FROM user_locks WHERE user_id = ?',
    [userId]
  );

  let activeSwap = null;
  if (lockRows.length > 0) {
    const swapId = lockRows[0].locked_by_swap_id;
    const [swapRows] = await pool.query(
      `SELECT sr.id AS swapId, sr.status,
              CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END AS partnerId,
              p.name AS partnerName
       FROM swap_requests sr
       JOIN profiles p ON p.user_id = (CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END)
       WHERE sr.id = ?`,
      [userId, userId, swapId]
    );
    activeSwap = swapRows[0] || null;
  }

  const [pendingRequestRows] = await pool.query(
    `SELECT COUNT(*) AS count FROM swap_requests WHERE recipient_id = ? AND status = 'pending'`,
    [userId]
  );

  return {
    name: profileRows[0]?.name || null,
    skills: {
      verified: skillCounts[0].verified || 0,
      pendingQuiz: skillCounts[0].pendingQuiz || 0,
      cooldown: skillCounts[0].cooldown || 0
    },
    wantedCount: wantedCountRows[0].count,
    activeSwap,
    pendingRequestsCount: pendingRequestRows[0].count,
    recentSwaps: await getRecentCompletedSwaps(userId),
    feedTeaser: await getFeedTeaser()
  };
}

async function getRecentCompletedSwaps(userId, limit = 3) {
  const [rows] = await pool.query(
    `SELECT sr.id, sr.completed_at AS completedAt,
            CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END AS partnerId,
            p.name AS partnerName,
            CASE WHEN sr.requester_id = ? THEN os.name ELSE ws.name END AS skillTaught,
            CASE WHEN sr.requester_id = ? THEN ws.name ELSE os.name END AS skillLearned
     FROM swap_requests sr
     JOIN skills os ON os.id = sr.offered_skill_id
     JOIN skills ws ON ws.id = sr.wanted_skill_id
     JOIN profiles p ON p.user_id = (CASE WHEN sr.requester_id = ? THEN sr.recipient_id ELSE sr.requester_id END)
     WHERE (sr.requester_id = ? OR sr.recipient_id = ?) AND sr.status = 'completed'
     ORDER BY sr.completed_at DESC
     LIMIT ?`,
    [userId, userId, userId, userId, userId, userId, limit]
  );
  return rows;
}

async function getFeedTeaser(limit = 2) {
  const [rows] = await pool.query(
    `SELECT p.id, p.description, pr.name AS posterName
     FROM projects p
     JOIN profiles pr ON pr.user_id = p.user_id
     ORDER BY p.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

module.exports = { getDashboardData, getRecentCompletedSwaps, getFeedTeaser };