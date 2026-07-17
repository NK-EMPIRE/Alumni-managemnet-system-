const settingsRepository = require('../repositories/settings.repository');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

function inferGroup(key) {
  if (key.startsWith('session_') || key.startsWith('password_') || key.startsWith('max_') || key.startsWith('lockout_') || key.startsWith('two_factor_')) return 'security';
  if (key.startsWith('email_')) return 'email';
  if (key.startsWith('notif_') || key.startsWith('leader_notif_') || key.startsWith('member_notif_')) return 'notifications';
  if (key.startsWith('app.') || key === 'site_name' || key === 'college_name' || key.startsWith('assignment_') || key.startsWith('import_')) return 'general';
  return 'general';
}

const getSettings = asyncHandler(async (req, res) => {
  const { group } = req.query;
  const settings = group ? await settingsRepository.findAllByGroup(group) : await settingsRepository.findAll();
  const result = {};
  settings.forEach(s => {
    result[s.setting_key] = s.setting_value;
  });
  success(res, result, 'Settings retrieved successfully');
});

const getSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const setting = await settingsRepository.findByKey(key);
  if (!setting) {
    throw new NotFoundError('Setting not found: ' + key);
  }
  success(res, { key: setting.setting_key, value: setting.setting_value, group: setting.setting_group }, 'Setting retrieved successfully');
});

const updateSettings = asyncHandler(async (req, res) => {
  var settingsObj = req.body.settings || req.body;
  if (!settingsObj || typeof settingsObj !== 'object' || Object.keys(settingsObj).length === 0) {
    return res.status(400).json({ success: false, message: 'A non-empty settings object is required' });
  }
  const results = [];
  for (const [key, value] of Object.entries(settingsObj)) {
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
    const group = inferGroup(key);
    const updated = await settingsRepository.upsert(key, String(value), group);
    results.push(updated);
  }
  success(res, results, 'Settings updated successfully');
});

const deleteSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const existing = await settingsRepository.findByKey(key);
  if (!existing) {
    throw new NotFoundError('Setting not found: ' + key);
  }
  await settingsRepository.removeByKey(key);
  success(res, { key }, 'Setting deleted successfully');
});

const getDbStatus = asyncHandler(async (req, res) => {
  const { sql, getPool } = require('../config/database');
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    const dbResult = await pool.request().query(`
      SELECT DB_NAME() AS database_name,
             SERVERPROPERTY('ProductVersion') AS version,
             SERVERPROPERTY('Edition') AS edition,
             SERVERPROPERTY('ProductLevel') AS product_level
    `);
    success(res, {
      connected: true,
      host: process.env.DB_SERVER || 'localhost',
      port: process.env.DB_PORT || '1433',
      database: dbResult.recordset[0]?.database_name || process.env.DB_DATABASE,
      version: dbResult.recordset[0]?.version || '',
      edition: dbResult.recordset[0]?.edition || '',
      productLevel: dbResult.recordset[0]?.product_level || ''
    }, 'Database connection successful');
  } catch (err) {
    success(res, {
      connected: false,
      host: process.env.DB_SERVER || 'localhost',
      port: process.env.DB_PORT || '1433',
      error: err.message
    }, 'Database connection failed');
  }
});

module.exports = {
  getSettings,
  getSettingByKey,
  updateSettings,
  deleteSetting,
  getDbStatus
};
