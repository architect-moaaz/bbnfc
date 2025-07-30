import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ButtonProps extends MuiButtonProps {
  loading?: boolean;
}

const StyledButton = styled(MuiButton)(({ theme }) => ({
  // Ensure minimum touch target size for accessibility
  minHeight: '44px',
  minWidth: '44px',
  
  // Add focus visible styles for keyboard navigation
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
  
  // Respect reduced motion preferences
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
}));

const Button: React.FC<ButtonProps> = ({ 
  children, 
  loading = false, 
  disabled,
  startIcon,
  endIcon,
  ...props 
}) => {
  return (
    <StyledButton
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
      endIcon={!loading ? endIcon : undefined}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </StyledButton>
  );
};

export default Button;