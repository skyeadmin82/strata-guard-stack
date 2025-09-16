import { useState, useCallback } from 'react';
import { FormValidationError } from '@/types/database';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

export const useFormValidation = (schema: ValidationSchema) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = schema[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} must not exceed ${rule.maxLength} characters`;
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} format is invalid`;
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [schema]);

  const validateForm = useCallback((data: Record<string, any>): FormValidationError[] => {
    const validationErrors: FormValidationError[] = [];
    const newErrors: Record<string, string> = {};

    Object.keys(schema).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        validationErrors.push({ field, message: error });
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return validationErrors;
  }, [schema, validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleBlur = useCallback((field: string, value: any) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    if (error) {
      setFieldError(field, error);
    } else {
      clearFieldError(field);
    }
  }, [validateField, setFieldError, clearFieldError]);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    touched,
    validateForm,
    validateField,
    clearErrors,
    setFieldError,
    clearFieldError,
    handleBlur,
    isValid,
  };
};