import React from 'react';
import { Box, Typography } from '@mui/material';

interface ContactActionIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  backgroundColor?: string;
}

const ContactActionIcon: React.FC<ContactActionIconProps> = ({
  icon,
  label,
  onClick,
  href,
  backgroundColor = '#F3F4F6',
}) => {
  const handleClick = () => {
    if (href) {
      window.location.href = href;
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        cursor: 'pointer',
        minWidth: '70px',
      }}
    >
      <Box
        sx={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          backgroundColor: backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: '#6B7280',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export default ContactActionIcon;
