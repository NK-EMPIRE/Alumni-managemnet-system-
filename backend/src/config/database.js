const sql = require('mssql');

let pool = null;

function buildConfig() {
  return {
    user: process.env.DB_USERNAME || process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || process.env.DB_SERVER,
    database: process.env.DB_NAME || process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000
    },
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
      enableArithAbort: true
    }
  };
}

async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(buildConfig());
  pool.on('error', (err) => {
    console.error('SQL Pool error:', err);
    pool = null;
  });
  return pool;
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = { sql, getPool, closePool, connectDB: getPool };