const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db/pool');

const FIRST_NAMES = ['Aarav', 'Diya', 'Kabir', 'Ananya', 'Vihaan', 'Ishita', 'Arjun', 'Meera',
    'Rohan', 'Priya', 'Sai', 'Tanvi', 'Karthik', 'Nisha', 'Aditya', 'Riya',
    'Varun', 'Sneha', 'Dev', 'Pooja', 'Rahul', 'Anjali', 'Vikram', 'Kavya', 'Nikhil'];

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
    try {
        const [skills] = await pool.query('SELECT id, name FROM skills');
        if (skills.length < 8) {
            console.error('❌ Need at least 8 skills seeded before running this script.');
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash('testpass123', 10);

        for (let i = 0; i < 25; i++) {
            const userId = uuidv4();
            const email = `testuser${i + 1}@example.com`;
            const name = FIRST_NAMES[i];

            await pool.query(
                'INSERT INTO users (id, email, password_hash, role, email_verified, account_status) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, email, passwordHash, 'user', true, 'active']
            );

            await pool.query(
                'INSERT INTO profiles (user_id, name, experience) VALUES (?, ?, ?)',
                [userId, name, `Seeded test user #${i + 1}`]
            );

            const shuffled = shuffle(skills);
            const knownCount = randomInt(2, 4);
            const knownSkills = shuffled.slice(0, knownCount);
            const remaining = shuffled.slice(knownCount);
            const wantedCount = Math.min(randomInt(2, 4), remaining.length);
            const wantedSkills = remaining.slice(0, wantedCount);

            for (const skill of knownSkills) {
                await pool.query(
                    `INSERT INTO user_known_skills (id, user_id, skill_id, status, verified_at, best_quiz_score, self_rating)
           VALUES (?, ?, ?, 'verified', NOW(), 50, ?)`,
                    [uuidv4(), userId, skill.id, randomInt(6, 10)]
                );
            }

            for (const skill of wantedSkills) {
                await pool.query(
                    'INSERT INTO user_wanted_skills (id, user_id, skill_id) VALUES (?, ?, ?)',
                    [uuidv4(), userId, skill.id]
                );
            }

            console.log(`✅ ${name} (${email}) — knows: ${knownSkills.map(s => s.name).join(', ')} | wants: ${wantedSkills.map(s => s.name).join(', ')}`);
        }

        console.log('\n🎉 All 25 users seeded. Password for all: testpass123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
}

run();