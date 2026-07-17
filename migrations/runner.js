const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../backend/src/config/database');

async function runMigrations() {
  const pool = await getPool();
  
  // Ensure the Migrations tracking table exists
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('dbo.Migrations') AND type = 'U')
    BEGIN
      CREATE TABLE dbo.Migrations (
        migration_id INT IDENTITY PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT GETUTCDATE()
      );
    END
  `);

  // Read migrations folder
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    // Check if migration has already run
    const checkRes = await pool.request()
      .input('filename', sql.VarChar(255), file)
      .query('SELECT 1 FROM dbo.Migrations WHERE filename = @filename');

    if (checkRes.recordset.length === 0) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Execute SQL content. Some SQL files might contain multiple statements.
      // MSSQL node package request.query executes standard batches.
      await pool.request().query(sqlContent);

      // Record migration
      await pool.request()
        .input('filename', sql.VarChar(255), file)
        .query('INSERT INTO dbo.Migrations (filename) VALUES (@filename)');
      console.log(`Successfully executed ${file}`);
    }
  }
}

module.exports = { runMigrations };
