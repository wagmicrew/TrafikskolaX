/**
 * Standardized API response types for consistent error handling
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  field?: string; // For validation errors
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Common error codes
export const API_ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Business logic
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  BOOKING_UNAVAILABLE: 'BOOKING_UNAVAILABLE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// Success response builders
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

export function createPaginatedResponse<T>(
  data: T[], 
  pagination: PaginatedResponse<T>['pagination'],
  message?: string
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination,
    message
  };
}

// Error response builders
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
  field?: string
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      field
    }
  };
}

// Common error responses
export const CommonErrors = {
  unauthorized: () => createErrorResponse(
    API_ERROR_CODES.UNAUTHORIZED,
    'Authentication required'
  ),
  
  forbidden: () => createErrorResponse(
    API_ERROR_CODES.FORBIDDEN,
    'Insufficient permissions'
  ),
  
  notFound: (resource: string = 'Resource') => createErrorResponse(
    API_ERROR_CODES.NOT_FOUND,
    `${resource} not found`
  ),
  
  validationError: (message: string, field?: string) => createErrorResponse(
    API_ERROR_CODES.VALIDATION_ERROR,
    message,
    undefined,
    field
  ),
  
  internalError: () => createErrorResponse(
    API_ERROR_CODES.INTERNAL_ERROR,
    'An internal server error occurred'
  )
};
