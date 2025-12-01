const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (we'll convert to Base64)
const storage = multer.memoryStorage();

// File filter to accept only images
const imageFilter = (req, file, cb) => {
  // Accept images only
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// File filter to accept common document types
const documentFilter = (req, file, cb) => {
  // Accept images and common document types
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  // Common MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/vnd.apple.pages',
    'application/vnd.apple.numbers',
    'application/vnd.apple.keynote'
  ];

  const mimetypeMatch = allowedMimeTypes.includes(file.mimetype);

  if (mimetypeMatch || extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed. Supported types: images (jpeg, jpg, png, gif, webp), documents (pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv)'));
  }
};

// Create multer upload middleware for images only
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size (safe for MongoDB 16MB doc limit with base64 encoding)
  },
  fileFilter: imageFilter,
});

// Create multer upload middleware for all file types
const uploadFile = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size (safe for MongoDB 16MB doc limit with base64 encoding)
  },
  fileFilter: documentFilter,
});

// Middleware to convert uploaded image to Base64
const convertToBase64 = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Convert buffer to Base64
    const base64String = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    // Create data URI
    req.fileBase64 = `data:${mimeType};base64,${base64String}`;
    
    // Clean up the file from memory
    delete req.file;
    
    next();
  } catch (error) {
    console.error('Error converting image to Base64:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process image',
    });
  }
};

module.exports = {
  upload,
  uploadFile,
  convertToBase64,
};