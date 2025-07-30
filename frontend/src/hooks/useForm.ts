import { useState, useCallback } from 'react';
import { validateField, validateForm as validate, ValidationRule } from '../utils/validation';
import { announceToScreenReader } from '../utils/accessibility';

interface UseFormProps<T> {
  initialValues: T;
  validationRules: Record<keyof T, ValidationRule>;
  onSubmit: (values: T) => Promise<void> | void;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  loading: boolean;
  touched: Record<keyof T, boolean>;
  handleChange: (field: keyof T) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: string) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
  reset: () => void;
  isValid: boolean;
}

export const useForm = <T extends Record<string, string>>({
  initialValues,
  validationRules,
  onSubmit,
}: UseFormProps<T>): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [loading, setLoading] = useState(false);
  
  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 && Object.keys(touched).length > 0;
  
  const handleChange = useCallback(
    (field: keyof T) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      
      setValues(prev => ({ ...prev, [field]: value }));
      
      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    },
    [errors]
  );
  
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      
      const rules = validationRules[field];
      const result = validateField(values[field], rules);
      
      if (!result.isValid && result.error) {
        setErrors(prev => ({ ...prev, [field]: result.error! }));
      }
    },
    [values, validationRules]
  );
  
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      
      // Validate entire form
      const { isValid: formIsValid, errors: validationErrors } = validate(
        values,
        validationRules
      );
      
      if (!formIsValid) {
        setErrors(validationErrors as Record<keyof T, string>);
        announceToScreenReader('Please fix the errors in the form');
        
        // Focus first error field
        const firstErrorField = Object.keys(validationErrors)[0];
        const firstErrorElement = document.getElementById(firstErrorField);
        firstErrorElement?.focus();
        
        return;
      }
      
      setLoading(true);
      
      try {
        await onSubmit(values);
      } catch (error: any) {
        // Handle submission errors
        const errorMessage = error.message || 'An error occurred. Please try again.';
        announceToScreenReader(errorMessage);
        throw error; // Re-throw to allow component to handle
      } finally {
        setLoading(false);
      }
    },
    [values, validationRules, onSubmit]
  );
  
  const setFieldValue = useCallback((field: keyof T, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);
  
  const clearErrors = useCallback(() => {
    setErrors({} as Record<keyof T, string>);
  }, []);
  
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string>);
    setTouched({} as Record<keyof T, boolean>);
    setLoading(false);
  }, [initialValues]);
  
  return {
    values,
    errors,
    loading,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    clearErrors,
    reset,
    isValid,
  };
};