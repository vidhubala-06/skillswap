const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db/pool');

const NAMES = ['Kiran', 'Divya', 'Manoj', 'Swathi', 'Harish', 'Lavanya', 'Suresh', 'Deepa',
    'Ganesh', 'Ramya', 'Vinay', 'Nithya', 'Ashok', 'Preethi', 'Bharath', 'Sowmya',
    'Naveen', 'Keerthi', 'Yogesh', 'Madhavi', 'Prasad', 'Chitra', 'Ravi', 'Anitha',
    'Sanjay', 'Bhavana', 'Ajay', 'Suja', 'Mahesh', 'Radha'];

function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
    try {
        const [allSkills] = await pool.query('SELECT id, name FROM skills');

        const [main] = await pool.query('SELECT id FROM users WHERE email = ?', ['vidhubalaga.cse2024@citchennai.net']);
        const [partner] = await pool.query('SELECT id FROM users WHERE email = ?', ['testpartner@example.com']);
        const mainId = main[0].id;
        const partnerId = partner[0].id;

        const [mainKnown] = await pool.query('SELECT skill_id FROM user_known_skills WHERE user_id = ?', [mainId]);
        const [mainWanted] = await pool.query('SELECT skill_id FROM user_wanted_skills WHERE user_id = ?', [mainId]);
        const [partnerKnown] = await pool.query('SELECT skill_id FROM user_known_skills WHERE user_id = ?', [partnerId]);
        const [partnerWanted] = await pool.query('SELECT skill_id FROM user_wanted_skills WHERE user_id = ?', [partnerId]);

        const targetKnownIds = [...mainKnown, ...partnerKnown].map(r => r.skill_id);
        const targetWantedIds = [...mainWanted, ...partnerWanted].map(r => r.skill_id);

        const passwordHash = await bcrypt.hash('testpass123', 10);

        for (let i = 0; i < 30; i++) {
            const userId = uuidv4();
            const email = `matchtest${i + 1}@example.com`;
            const name = NAMES[i];

            await pool.query(
                'INSERT INTO users (id, email, password_hash, role, email_verified, account_status) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, email, passwordHash, 'user', true, 'active']
            );
            await pool.query('INSERT INTO profiles (user_id, name, experience) VALUES (?, ?, ?)', [userId, name, `Match test user #${i + 1}`]);

            const biasOverlap = i < 15; // first half deliberately overlaps
            let knownSkillIds = new Set();
            let wantedSkillIds = new Set();

            if (biasOverlap && targetWantedIds.length > 0) {
                // this user KNOWS something main/partner WANTS (sets up a match toward them)
                const pick = targetWantedIds[randomInt(0, targetWantedIds.length - 1)];
                knownSkillIds.add(pick);
            }
            if (biasOverlap && targetKnownIds.length > 0) {
                // this user WANTS something main/partner KNOWS (sets up the reciprocal, two-way match)
                const pick = targetKnownIds[randomInt(0, targetKnownIds.length - 1)];
                if (!knownSkillIds.has(pick)) wantedSkillIds.add(pick);
            }

            // fill out the rest randomly, avoiding overlap between known/wanted for this user
            const shuffled = shuffle(allSkills.filter(s => !knownSkillIds.has(s.id) && !wantedSkillIds.has(s.id)));
            let idx = 0;
            while (knownSkillIds.size < randomInt(2, 4) && idx < shuffled.length) {
                knownSkillIds.add(shuffled[idx].id);
                idx++;
            }
            while (wantedSkillIds.size < randomInt(2, 4) && idx < shuffled.length) {
                if (!knownSkillIds.has(shuffled[idx].id)) wantedSkillIds.add(shuffled[idx].id);
                idx++;
            }

            for (const skillId of knownSkillIds) {
                await pool.query(
                    `INSERT INTO user_known_skills (id, user_id, skill_id, status, verified_at, best_quiz_score, self_rating)
           VALUES (?, ?, ?, 'verified', NOW(), 50, ?)`,
                    [uuidv4(), userId, skillId, randomInt(6, 10)]
                );
            }
            for (const skillId of wantedSkillIds) {
                await pool.query('INSERT INTO user_wanted_skills (id, user_id, skill_id) VALUES (?, ?, ?)', [uuidv4(), userId, skillId]);
            }

            console.log(`✅ ${name} (${email})${biasOverlap ? ' [overlap-biased]' : ''}`);
        }

        console.log('\n🎉 30 more users seeded. Password for all: testpass123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
}

run();