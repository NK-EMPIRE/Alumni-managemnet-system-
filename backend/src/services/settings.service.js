const settingsRepo = require('../repositories/settings.repository');

async function getAllSettings() {
  const list = await settingsRepo.findAll();
  const settingsObj = {};
  list.forEach(item => {
    settingsObj[item.setting_key] = item.setting_value;
  });
  return settingsObj;
}

async function saveSettings(settings, group = 'general') {
  for (const key of Object.keys(settings)) {
    let val = settings[key];
    if (typeof val === 'boolean') {
      val = val ? 'true' : 'false';
    } else if (val !== null && val !== undefined) {
      val = String(val);
    } else {
      val = '';
    }
    await settingsRepo.upsert(key, val, group);
  }
  return true;
}

module.exports = {
  getAllSettings,
  saveSettings
};
