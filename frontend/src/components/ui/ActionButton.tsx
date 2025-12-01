import React from 'react';
import { Box, Typography } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  showChevron?: boolean;
  variant?: 'primary' | 'secondary';
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  href,
  showChevron = true,
  variant = 'secondary',
}) => {
  const isPrimary = variant === 'primary';

  const handleClick = () => {
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderRadius: '12px',
        backgroundColor: isPrimary ? '#2D6EF5' : '#FFFFFF',
        border: isPrimary ? 'none' : '1.5px solid #E5E7EB',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isPrimary
            ? '0px 4px 12px rgba(45, 110, 245, 0.25)'
            : '0px 4px 12px rgba(0, 0, 0, 0.08)',
          borderColor: !isPrimary ? '#D1D5DB' : undefined,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isPrimary ? '#FFFFFF' : '#2D6EF5',
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: isPrimary ? '#FFFFFF' : '#1A1A1A',
            fontSize: '0.9375rem',
          }}
        >
          {label}
        </Typography>
      </Box>
      {showChevron && (
        <ChevronRight
          sx={{
            fontSize: 20,
            color: isPrimary ? '#FFFFFF' : '#9CA3AF',
          }}
        />
      )}
    </Box>
  );
};

export default ActionButton;
