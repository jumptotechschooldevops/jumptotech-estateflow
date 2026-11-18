const multer = require('multer');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Unsupported image type — use JPEG, PNG, or WebP'));
    }
    cb(null, true);
  },
});

module.exports = { upload, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES };
