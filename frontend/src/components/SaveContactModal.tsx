import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Avatar,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  FileDownload as DownloadIcon,
  QrCode2 as QrCodeIcon,
  CheckCircle as CheckIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { Profile } from '../types';
import QRCode from 'qrcode';

interface SaveContactModalProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  profileId: string;
}

const SaveContactModal: React.FC<SaveContactModalProps> = ({ open, onClose, profile, profileId }) => {
  const [showQR, setShowQR] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (open && profileId) {
      const profileUrl = window.location.href;
      QRCode.toDataURL(profileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1A1A1A',
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [open, profileId]);

  const handleDownload = async () => {
    try {
      const { profileToVCard, generateSimpleVCard } = await import('../utils/vcard');
      const vCardData = profileToVCard(profile);
      const vCardContent = generateSimpleVCard(vCardData);
      const fileName = `${profile.personalInfo.firstName}_${profile.personalInfo.lastName}.vcf`;

      const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });

      // Try Web Share API first (mobile)
      if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const file = new File([blob], fileName, { type: 'text/vcard' });
        try {
          await navigator.share({
            files: [file],
            title: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
          });
          return;
        } catch (err) {
          console.log('Share API failed, falling back to download');
        }
      }

      // Fallback to download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save contact:', error);
      alert('Unable to save contact. Please try again.');
    }
  };

  const fullName = `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'visible',
        }
      }}
    >
      {/* Icon at top */}
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            bgcolor: '#2D6EF5',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(45, 110, 245, 0.3)',
          }}
        >
          <PersonAddIcon sx={{ fontSize: 32, color: '#FFFFFF' }} />
        </Box>
      </Box>

      <DialogContent sx={{ pt: 7, pb: 4, px: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontSize: '1.5rem' }}>
            Save Contact
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontSize: '0.9375rem' }}>
            Add {profile.personalInfo.firstName} to your address book
          </Typography>

          {/* Profile Preview */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              bgcolor: '#F9FAFB',
              borderRadius: '12px',
              mb: 3,
              position: 'relative',
            }}
          >
            <Avatar
              src={profile.personalInfo.profilePhoto}
              sx={{ width: 48, height: 48 }}
            >
              {profile.personalInfo.firstName?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: '0.9375rem' }}>
                {fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                {profile.personalInfo.title} • {profile.personalInfo.company || 'Creative Solutio...'}
              </Typography>
            </Box>
            <CheckIcon sx={{ color: '#2D6EF5', fontSize: 24 }} />
          </Box>

          {!showQR ? (
            <>
              {/* Download Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  height: 52,
                  fontSize: '0.9375rem',
                  mb: 2,
                  backgroundColor: '#2D6EF5',
                  boxShadow: '0 4px 12px rgba(45, 110, 245, 0.3)',
                  '&:hover': {
                    backgroundColor: '#1E5BE6',
                    boxShadow: '0 6px 16px rgba(45, 110, 245, 0.4)',
                  },
                }}
              >
                Download vCard (.vcf)
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, fontSize: '0.75rem' }}>
                Compatible with iOS Contacts, Google Contacts, and Outlook
              </Typography>

              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  OR
                </Typography>
              </Divider>

              {/* Scan QR Button */}
              <Button
                fullWidth
                variant="text"
                startIcon={<QrCodeIcon />}
                onClick={() => setShowQR(true)}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  height: 48,
                  fontSize: '0.9375rem',
                  color: '#6B7280',
                  backgroundColor: '#F9FAFB',
                  '&:hover': {
                    backgroundColor: '#F3F4F6',
                  },
                }}
              >
                Scan to save on phone
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={onClose}
                sx={{
                  mt: 2,
                  color: '#6B7280',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              {/* QR Code View */}
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <QrCodeIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    Scan to save on phone
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2,
                    bgcolor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '2px solid #F3F4F6',
                  }}
                >
                  {qrCodeDataUrl && (
                    <Box
                      component="img"
                      src={qrCodeDataUrl}
                      alt="QR Code"
                      sx={{ width: 200, height: 200 }}
                    />
                  )}
                </Box>
              </Box>

              <Button
                fullWidth
                variant="text"
                onClick={() => setShowQR(false)}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  height: 48,
                  fontSize: '0.9375rem',
                  color: '#6B7280',
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SaveContactModal;
