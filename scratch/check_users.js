const dotenv = require('dotenv');
dotenv.config();
const { getPool } = require('../backend/src/config/database');

async function check() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT u.user_id, u.first_name, u.last_name, u.email, r.role_name
      FROM Users u
      INNER JOIN Roles r ON u.role_id = r.role_id
    `);
    console.log("Users in DB:", result.recordset);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
