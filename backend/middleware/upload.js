const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (we'll convert to Base64)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
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

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
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
  convertToBase64,
};