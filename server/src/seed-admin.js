const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db/pool');

async function run() {
    try {
        const email = 'vidhuananth06@gmail.com';
        const password = await bcrypt.hash('skilladmin', 10);
        const userId = uuidv4();

        await pool.query(
            'INSERT INTO users (id, email, password_hash, role, email_verified, account_status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, email, password, 'admin', true, 'active']
        );

        await pool.query(
            'INSERT INTO profiles (user_id, name, experience) VALUES (?, ?, ?)',
            [userId, 'Admin', 'Platform administrator']
        );

        console.log(`✅ Admin created: ${email} / adminpass123`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
}

run();