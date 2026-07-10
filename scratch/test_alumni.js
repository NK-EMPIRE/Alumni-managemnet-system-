const dotenv = require('dotenv');
dotenv.config();
const { getPool, sql } = require('../backend/src/config/database');

async function test() {
  const pool = await getPool();
  
  // Pick first real alumni
  const r = await pool.request().query('SELECT TOP 3 alumni_id, register_no, name, company, linkedin_profile, working_details FROM Alumni ORDER BY alumni_id ASC');
  console.log('Sample alumni:', r.recordset);
  
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
