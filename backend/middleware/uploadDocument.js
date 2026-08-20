const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/documents");
  },

  filename(req, file, cb) {
    cb(
      null,
      Date.now() + "-" + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

module.exports = upload;