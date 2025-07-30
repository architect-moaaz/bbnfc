/**
 * Form validation utilities following design guidelines
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateField = (value: string, rules: ValidationRule): ValidationResult => {
  // Required validation
  if (rules.required && (!value || value.trim().length === 0)) {
    return { isValid: false, error: 'This field is required' };
  }

  // Skip other validations if field is empty and not required
  if (!value || value.trim().length === 0) {
    return { isValid: true };
  }

  // Minimum length validation
  if (rules.minLength && value.length < rules.minLength) {
    return {
      isValid: false,
      error: `Must be at least ${rules.minLength} characters long`,
    };
  }

  // Maximum length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    return {
      isValid: false,
      error: `Must be no more than ${rules.maxLength} characters long`,
    };
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, error: 'Invalid format' };
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return { isValid: false, error: customError };
    }
  }

  return { isValid: true };
};

// Common validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !value.includes('@')) {
        return 'Please enter a valid email address';
      }
      return null;
    },
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (value && value.length >= 8) {
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumbers = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
          return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
      }
      return null;
    },
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    custom: (value: string) => {
      if (value && !/^[a-zA-Z\s]+$/.test(value)) {
        return 'Name can only contain letters and spaces';
      }
      return null;
    },
  },
  confirmPassword: (originalPassword: string) => ({
    required: true,
    custom: (value: string) => {
      if (value !== originalPassword) {
        return 'Passwords do not match';
      }
      return null;
    },
  }),
};

// Form validation function
export const validateForm = (formData: Record<string, string>, rules: Record<string, ValidationRule>) => {
  const errors: Record<string, string> = {};
  let isFormValid = true;

  Object.keys(rules).forEach((fieldName) => {
    const fieldValue = formData[fieldName] || '';
    const fieldRules = rules[fieldName];
    const result = validateField(fieldValue, fieldRules);

    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
      isFormValid = false;
    }
  });

  return { isValid: isFormValid, errors };
};

// Form validation hook (for backward compatibility)
export const useFormValidation = () => {
  return { validateForm, validateField };
};

// Password strength checker
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score < 3) return { score, label: 'Weak', color: '#EF4444' };
  if (score < 5) return { score, label: 'Medium', color: '#F59E0B' };
  return { score, label: 'Strong', color: '#10B981' };
};