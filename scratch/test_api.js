const dotenv = require('dotenv');
dotenv.config();
const { getPool } = require('../backend/src/config/database');
const jwt = require('jsonwebtoken');

async function test() {
  try {
    const pool = await getPool();
    // Get user 'ert'
    const userResult = await pool.request()
      .query(`
        SELECT u.user_id, u.email, r.role_name 
        FROM Users u 
        INNER JOIN Roles r ON u.role_id = r.role_id 
        WHERE u.first_name = 'ert'
      `);
    if (userResult.recordset.length === 0) {
      console.log("User ert not found");
      process.exit(1);
    }
    const user = userResult.recordset[0];
    console.log("User:", user);

    // Mock API call to getMyAssignments on backend
    const alumniService = require('../backend/src/services/alumni.service');
    const result = await alumniService.getMyAssignments(user.user_id, user.role_name, { page: 1, limit: 100, onlyMe: true });
    console.log("Service result keys:", Object.keys(result));
    console.log("Service result data length:", result.data.length);
    console.log("First assignment:", result.data[0]);

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

test();
