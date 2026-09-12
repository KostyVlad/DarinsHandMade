const multer = require('multer');
const path = require('path');
const fs = require('fs');

// multer takes the picture out of the form and saves it on the disk.
const storage = multer.diskStorage({
  // Which folder the picture goes to.
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  // Which name it gets. Date.now() is added so two pictures with the
  // same original name do not overwrite each other.
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .slice(0, 40);
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

// Only real pictures are accepted, so nobody can upload a script.
const fileFilter = (req, file, cb) => {
  if (/^image\//.test(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
});

module.exports = upload;
