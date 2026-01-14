const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/public';
    
    // Determine upload path based on user role or type
    if (req.user) {
      switch (req.user.role) {
        case 'admin':
          uploadPath = 'uploads/admin';
          break;
        case 'management':
          uploadPath = 'uploads/team';
          break;
        default:
          uploadPath = 'uploads/users';
      }
    } else if (req.body.type) {
      uploadPath = `uploads/${req.body.type}`;
    }

    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images (avatar)
const imageFileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// File filter for documents (accepts multiple file types)
const documentFileFilter = (req, file, cb) => {
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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  },
  fileFilter: imageFileFilter
});

// Upload for documents (larger file size limit)
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/documents';
    
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

const uploadDocuments = multer({
  storage: documentStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_DOCUMENT_SIZE) || 10485760 // 10MB default for documents
  },
  fileFilter: documentFileFilter
});

module.exports = { upload, uploadDocuments };

