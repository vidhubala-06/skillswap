const pool = require('../db/pool');

async function runQuizSessionCleanup() {
  try {
    const [expireResult] = await pool.query(
      `UPDATE quiz_sessions 
       SET status = 'expired' 
       WHERE status = 'active' AND expires_at < NOW()`
    );
    if (expireResult.affectedRows > 0) {
      console.log(`Marked ${expireResult.affectedRows} abandoned quiz session(s) as expired`);
    }

    const [deleteResult] = await pool.query(
      `DELETE FROM quiz_sessions 
       WHERE status IN ('submitted', 'expired') 
         AND created_at < NOW() - INTERVAL 48 HOUR`
    );
    if (deleteResult.affectedRows > 0) {
      console.log(`Cleaned up ${deleteResult.affectedRows} old quiz session(s)`);
    }
  } catch (err) {
    console.error('Quiz session cleanup failed:', err.message);
  }
}

module.exports = { runQuizSessionCleanup };