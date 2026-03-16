import { toast } from 'sonner';
import { ApiError } from '@/services/api.client';

/**
 * Global error handler utility
 */
export class ErrorHandler {
  /**
   * Handle API errors with user-friendly messages
   */
  static handleApiError(error: ApiError | any, customMessage?: string): void {
    console.error('API Error:', error);

    if (customMessage) {
      toast.error(customMessage);
      return;
    }

    // Handle different error types
    if (error?.status) {
      switch (error.status) {
        case 400:
          toast.error(error.message || 'Invalid request. Please check your input.');
          break;
        case 401:
          toast.error('Authentication required. Please login.');
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('The requested resource was not found.');
          break;
        case 409:
          toast.error(error.message || 'A conflict occurred. The resource may already exist.');
          break;
        case 422:
          toast.error(error.message || 'Validation failed. Please check your input.');
          if (error.errors) {
            this.handleValidationErrors(error.errors);
          }
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        case 0:
          toast.error('Network error. Please check your internet connection.');
          break;
        default:
          toast.error(error.message || 'An unexpected error occurred.');
      }
    } else {
      toast.error(error?.message || 'An unexpected error occurred.');
    }
  }

  /**
   * Handle validation errors
   */
  static handleValidationErrors(errors: Record<string, string[]> | string[]): void {
    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        toast.error(error);
      });
    } else {
      Object.entries(errors).forEach(([field, messages]) => {
        messages.forEach((message) => {
          toast.error(`${field}: ${message}`);
        });
      });
    }
  }

  /**
   * Handle success messages
   */
  static handleSuccess(message: string): void {
    toast.success(message);
  }

  /**
   * Handle info messages
   */
  static handleInfo(message: string): void {
    toast.info(message);
  }

  /**
   * Handle warning messages
   */
  static handleWarning(message: string): void {
    toast.warning(message);
  }
}

// Export convenience functions
export const showError = (error: ApiError | any, customMessage?: string) => 
  ErrorHandler.handleApiError(error, customMessage);

export const showSuccess = (message: string) => 
  ErrorHandler.handleSuccess(message);

export const showInfo = (message: string) => 
  ErrorHandler.handleInfo(message);

export const showWarning = (message: string) => 
  ErrorHandler.handleWarning(message);
