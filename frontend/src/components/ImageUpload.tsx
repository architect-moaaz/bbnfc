import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { uploadAPI } from '../services/api';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  uploadType: 'profile' | 'logo';
  label?: string;
  size?: number;
  rounded?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  uploadType,
  label = 'Upload Image',
  size = 120,
  rounded = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImage prop changes
  useEffect(() => {
    console.log('ImageUpload: currentImage changed:', currentImage);
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Upload the image
      const uploadFunction = uploadType === 'profile' 
        ? uploadAPI.uploadProfilePhoto 
        : uploadAPI.uploadCompanyLogo;
      
      const response = await uploadFunction(file);
      
      if (response.success && response.data) {
        const imageUrl = response.data.imageUrl;
        setPreview(imageUrl);
        onImageChange(imageUrl);
      } else {
        setError('Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
        {label}
      </Typography>
      
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        {preview ? (
          <Avatar
            src={preview}
            sx={{
              width: size,
              height: size,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: 'primary.main',
              '&:hover': {
                opacity: 0.8,
              },
            }}
            variant={rounded ? 'circular' : 'rounded'}
            onClick={handleClick}
            onError={(e) => {
              console.error('ImageUpload: Failed to load image:', preview?.substring(0, 100));
              setError('Failed to load image');
            }}
            onLoad={() => {
              console.log('ImageUpload: Image loaded successfully');
            }}
          />
        ) : (
          <Box
            onClick={handleClick}
            sx={{
              width: size,
              height: size,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: rounded ? '50%' : 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              bgcolor: 'action.hover',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.selected',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={40} />
            ) : (
              <PhotoCameraIcon sx={{ fontSize: 40, color: 'action.active' }} />
            )}
          </Box>
        )}
        
        {preview && !loading && (
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'error.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'error.dark',
              },
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={loading}
      />

      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<CloudUploadIcon />}
          onClick={handleClick}
          disabled={loading}
        >
          Choose Image
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 300, mx: 'auto' }}>
          {error}
        </Alert>
      )}

      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
        Max size: 5MB. Formats: JPEG, PNG, GIF, WebP
      </Typography>
    </Box>
  );
};

export default ImageUpload;