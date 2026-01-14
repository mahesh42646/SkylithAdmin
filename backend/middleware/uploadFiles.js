const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Unified storage that handles both avatar and documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let basePath = 'uploads';
    
    if (req.user) {
      switch (req.user.role) {
        case 'admin':
          basePath = 'uploads/admin';
          break;
        case 'management':
          basePath = 'uploads/team';
          break;
        default:
          basePath = 'uploads/users';
      }
    }

    // Determine subdirectory based on field name
    if (file.fieldname === 'avatar') {
      ensureDirectoryExists(basePath);
      cb(null, basePath);
    } else if (file.fieldname === 'documents') {
      const docPath = `${basePath}/documents`;
      ensureDirectoryExists(docPath);
      cb(null, docPath);
    } else {
      ensureDirectoryExists(basePath);
      cb(null, basePath);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    if (file.fieldname === 'avatar') {
      cb(null, `avatar-${uniqueSuffix}${ext}`);
    } else {
      const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Avatar must be an image
  if (file.fieldname === 'avatar') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Avatar must be an image file'), false);
    }
  } 
  // Documents can be various file types
  else if (file.fieldname === 'documents') {
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed: PDF, DOC, DOCX, XLS, XLSX, Images, TXT, ZIP`), false);
    }
  } else {
    cb(null, true);
  }
};

const uploadFiles = multer({
  storage: storage,
  limits: {
    fileSize: 10485760 // 10MB
  },
  fileFilter: fileFilter
});

module.exports = uploadFiles;

