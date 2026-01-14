const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage for documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/documents';
    
    // Determine upload path based on user role or type
    if (req.user) {
      switch (req.user.role) {
        case 'admin':
          uploadPath = 'uploads/admin/documents';
          break;
        case 'management':
          uploadPath = 'uploads/team/documents';
          break;
        default:
          uploadPath = 'uploads/users/documents';
      }
    } else if (req.body.type) {
      uploadPath = `uploads/${req.body.type}/documents`;
    }

    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter - accept common document types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
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
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, Images, TXT, ZIP`), false);
  }
};

const uploadDocuments = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default for documents
  },
  fileFilter: fileFilter
});

module.exports = uploadDocuments;

