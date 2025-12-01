import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import QRCode from 'qrcode';

interface QRCodeCardProps {
  url: string;
  size?: number;
}

const QRCodeCard: React.FC<QRCodeCardProps> = ({ url, size = 160 }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (url) {
      QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        color: {
          dark: '#1A1A1A',
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [url, size]);

  return (
    <Paper
      elevation={0}
      sx={{
        padding: 3,
        borderRadius: '16px',
        border: '1.5px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#FFFFFF',
      }}
    >
      {qrCodeDataUrl && (
        <Box
          component="img"
          src={qrCodeDataUrl}
          alt="QR Code"
          sx={{
            width: size,
            height: size,
            borderRadius: '12px',
            border: '2px solid #F3F4F6',
          }}
        />
      )}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#1A1A1A',
            mb: 0.5,
          }}
        >
          Scan to save on mobile
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.75rem',
            color: '#6B7280',
          }}
        >
          Compatible with iOS & Android
        </Typography>
      </Box>
    </Paper>
  );
};

export default QRCodeCard;
