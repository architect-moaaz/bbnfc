const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, convertToBase64 } = require('../middleware/upload');

// Upload profile photo
router.post('/profile-photo', protect, upload.single('photo'), convertToBase64, async (req, res) => {
  try {
    if (!req.fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    // Return the Base64 image data
    res.status(200).json({
      success: true,
      data: {
        imageUrl: req.fileBase64,
        message: 'Image uploaded successfully',
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
    });
  }
});

// Upload company logo
router.post('/company-logo', protect, upload.single('logo'), convertToBase64, async (req, res) => {
  try {
    if (!req.fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    // Return the Base64 image data
    res.status(200).json({
      success: true,
      data: {
        imageUrl: req.fileBase64,
        message: 'Logo uploaded successfully',
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload logo',
    });
  }
});

// Upload file (PDF, documents, etc.)
router.post('/file', protect, upload.single('file'), convertToBase64, async (req, res) => {
  try {
    if (!req.fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Get file info
    const fileInfo = {
      originalName: req.file?.originalname || 'file',
      mimeType: req.file?.mimetype || 'application/octet-stream',
      size: req.file?.size || 0,
    };

    // Return the Base64 file data
    res.status(200).json({
      success: true,
      data: {
        fileUrl: req.fileBase64,
        fileName: fileInfo.originalName,
        fileType: fileInfo.mimeType,
        fileSize: fileInfo.size,
        message: 'File uploaded successfully',
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
    });
  }
});

module.exports = router;