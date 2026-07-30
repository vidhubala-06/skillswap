const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db/pool');

async function run() {
  try {
    const email = 'testpartner@example.com';
    const password = await bcrypt.hash('testpass123', 10);
    const userId = uuidv4();

    // 1. Create the user — already verified, active, no need to go through email verification
    await pool.query(
      'INSERT INTO users (id, email, password_hash, role, email_verified, account_status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, password, 'user', true, 'active']
    );

    // 2. Create their profile
    await pool.query(
      'INSERT INTO profiles (user_id, name, experience) VALUES (?, ?, ?)',
      [userId, 'Test Partner', 'Test account for Find Match']
    );

    // 3. Known skill — REPLACE skillIdTheyKnow below with the skill_id from your query above
    const skillIdTheyKnow = 4; // <-- update this based on what you found
    await pool.query(
      `INSERT INTO user_known_skills (id, user_id, skill_id, status, verified_at, best_quiz_score) 
       VALUES (?, ?, ?, 'verified', NOW(), 50)`,
      [uuidv4(), userId, skillIdTheyKnow]
    );

    // 4. Wanted skill — React (skill_id 1), so it's a two-way match
    await pool.query(
      'INSERT INTO user_wanted_skills (id, user_id, skill_id) VALUES (?, ?, ?)',
      [uuidv4(), userId, 1]
    );

    console.log(`✅ Test partner created: ${email} / testpass123, userId: ${userId}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

run();