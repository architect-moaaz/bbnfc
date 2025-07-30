import React from 'react';
import {
  TextField,
  TextFieldProps,
  FormHelperText,
  Box,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface FormFieldProps extends Omit<TextFieldProps, 'error' | 'helperText'> {
  error?: string;
  showRequiredIndicator?: boolean;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    minHeight: '44px', // Accessibility: minimum touch target
    fontSize: '16px', // Prevents zoom on iOS
    
    '& fieldset': {
      borderColor: theme.palette.divider,
      transition: theme.transitions.create(['border-color']),
    },
    
    '&:hover fieldset': {
      borderColor: theme.palette.text.secondary,
    },
    
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '2px',
    },
    
    '&.Mui-error fieldset': {
      borderColor: theme.palette.error.main,
    },
  },
  
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    color: theme.palette.text.primary,
    
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
    
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  
  // Focus visible styles for keyboard navigation
  '& .MuiOutlinedInput-input:focus-visible': {
    outline: 'none', // Handled by the field border
  },
}));

const FormField: React.FC<FormFieldProps> = ({
  error,
  showRequiredIndicator = false,
  label,
  required,
  id,
  ...props
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  return (
    <Box>
      <StyledTextField
        id={fieldId}
        label={
          label && showRequiredIndicator && required ? (
            <Box component="span">
              {label}
              <Typography
                component="span"
                sx={{ color: 'error.main', ml: 0.5 }}
                aria-label="required"
              >
                *
              </Typography>
            </Box>
          ) : (
            label
          )
        }
        error={!!error}
        required={required}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      
      {error && (
        <FormHelperText
          id={errorId}
          error
          sx={{
            mt: 1,
            mx: 0,
            fontSize: '0.875rem',
            fontWeight: 400,
          }}
          role="alert"
        >
          {error}
        </FormHelperText>
      )}
    </Box>
  );
};

export default FormField;