const { sql, getPool } = require('../config/database');

async function findAll(group) {
  const pool = await getPool();
  const request = pool.request();
  let query = 'SELECT * FROM SystemSettings WHERE 1 = 1';
  if (group) {
    query += ' AND setting_group = @group';
    request.input('group', sql.NVarChar(100), group);
  }
  query += ' ORDER BY setting_key ASC';
  const result = await request.query(query);
  return result.recordset;
}

async function findByKey(key) {
  const pool = await getPool();
  const result = await pool.request()
    .input('key', sql.NVarChar(255), key)
    .query('SELECT * FROM SystemSettings WHERE setting_key = @key');
  return result.recordset[0];
}

async function upsert(key, value, group) {
  const pool = await getPool();
  const result = await pool.request()
    .input('key', sql.NVarChar(255), key)
    .input('value', sql.NVarChar(sql.MAX), value)
    .input('group', sql.NVarChar(100), group)
    .query(`
      MERGE SystemSettings AS target
      USING (SELECT @key AS setting_key) AS source
      ON target.setting_key = source.setting_key
      WHEN MATCHED THEN
        UPDATE SET setting_value = @value, updated_at = GETUTCDATE()
      WHEN NOT MATCHED THEN
        INSERT (setting_key, setting_value, setting_group)
        VALUES (@key, @value, @group)
      OUTPUT INSERTED.*;
    `);
  return result.recordset[0];
}

module.exports = {
  findAll,
  findByKey,
  upsert
};
