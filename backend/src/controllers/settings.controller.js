const settingsService = require('../services/settings.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getAllSettings();
  success(res, settings, 'Settings retrieved successfully');
});

const updateSettings = asyncHandler(async (req, res) => {
  const { settings, group } = req.body;
  await settingsService.saveSettings(settings, group);
  success(res, null, 'Settings updated successfully');
});

module.exports = {
  getSettings,
  updateSettings
};
