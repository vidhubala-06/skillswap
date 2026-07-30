const pool = require('./db/pool');

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT DATABASE() AS db_name');
    console.log('✅ Connected successfully to database:', rows[0].db_name);
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();