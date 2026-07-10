const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { UPLOAD } = require('../constants');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.resolve(__dirname, '../../uploads'));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (UPLOAD.ALLOWED_EXTENSIONS.includes(ext) && UPLOAD.ALLOWED_MIMES.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE }
});

module.exports = upload;