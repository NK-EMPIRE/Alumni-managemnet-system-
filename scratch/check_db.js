const dotenv = require('dotenv');
dotenv.config();
const { getPool } = require('../backend/src/config/database');

async function check() {
  try {
    const pool = await getPool();
    console.log("Connected to database.");
    
    // Find all alumni records to see dummy values
    const alumni = await pool.request()
      .query(`
        SELECT TOP 30 alumni_id, register_no, name, email, phone, department, batch, company, designation 
        FROM Alumni
        ORDER BY alumni_id ASC
      `);
    console.log("Alumni records in DB:", alumni.recordset);
    
    process.exit(0);
  } catch (err) {
    console.error("Database query failed:", err);
    process.exit(1);
  }
}

check();
