const { v4: uuidv4 } = require('uuid');
const pool = require('./db/pool');

async function addSkillsToUser(userId, knownCount, wantedCount) {
    const [allSkills] = await pool.query('SELECT id, name FROM skills');
    const [existingKnown] = await pool.query('SELECT skill_id FROM user_known_skills WHERE user_id = ?', [userId]);
    const [existingWanted] = await pool.query('SELECT skill_id FROM user_wanted_skills WHERE user_id = ?', [userId]);

    const existingIds = new Set([...existingKnown.map(r => r.skill_id), ...existingWanted.map(r => r.skill_id)]);
    const available = allSkills.filter(s => !existingIds.has(s.id));

    const shuffled = available.sort(() => Math.random() - 0.5);
    const newKnown = shuffled.slice(0, knownCount);
    const newWanted = shuffled.slice(knownCount, knownCount + wantedCount);

    for (const skill of newKnown) {
        await pool.query(
            `INSERT INTO user_known_skills (id, user_id, skill_id, status, verified_at, best_quiz_score, self_rating)
       VALUES (?, ?, ?, 'verified', NOW(), 50, ?)`,
            [uuidv4(), userId, skill.id, Math.floor(Math.random() * 5) + 6]
        );
    }
    for (const skill of newWanted) {
        await pool.query('INSERT INTO user_wanted_skills (id, user_id, skill_id) VALUES (?, ?, ?)', [uuidv4(), userId, skill.id]);
    }

    console.log(`Added to ${userId}: known [${newKnown.map(s => s.name).join(', ')}], wanted [${newWanted.map(s => s.name).join(', ')}]`);
}

async function run() {
    try {
        const [main] = await pool.query('SELECT id FROM users WHERE email = ?', ['vidhubalaga.cse2024@citchennai.net']);
        const [partner] = await pool.query('SELECT id FROM users WHERE email = ?', ['testpartner@example.com']);

        await addSkillsToUser(main[0].id, 3, 3);
        await addSkillsToUser(partner[0].id, 3, 3);

        console.log('✅ Done');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
}

run();