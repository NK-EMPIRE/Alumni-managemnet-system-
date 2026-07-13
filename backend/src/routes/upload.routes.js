const { Router } = require('express');
const uploadController = require('../controllers/upload.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate);

router.post(
  '/import',
  authorize(ROLES.ADMIN),
  upload.single('file'),
  uploadController.uploadExcel
);

router.post(
  '/preview',
  authorize(ROLES.ADMIN),
  upload.single('file'),
  uploadController.previewExcel
);

router.get(
  '/history',
  authorize(ROLES.ADMIN),
  uploadController.getImportHistory
);

router.get(
  '/template',
  authorize(ROLES.ADMIN),
  uploadController.downloadTemplate
);

module.exports = router;