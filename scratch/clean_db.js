const dotenv = require('dotenv');
dotenv.config();
const { getPool } = require('../backend/src/config/database');

async function clean() {
  try {
    const pool = await getPool();
    console.log("Connected to database.");
    
    // Clean dummy alumni records (John Doe, Jane Smith, Bob Wilson)
    const result = await pool.request()
      .query(`
        DELETE FROM AlumniAssignments 
        WHERE alumni_id IN (
          SELECT alumni_id FROM Alumni WHERE register_no IN ('REG001', 'REG002', 'REG003')
        )
      `);
    console.log("Cleaned dependent assignments:", result.rowsAffected);

    const result2 = await pool.request()
      .query(`
        DELETE FROM Alumni 
        WHERE register_no IN ('REG001', 'REG002', 'REG003')
      `);
    console.log("Cleaned dummy alumni records:", result2.rowsAffected);
    
    process.exit(0);
  } catch (err) {
    console.error("Clean failed:", err);
    process.exit(1);
  }
}

clean();
