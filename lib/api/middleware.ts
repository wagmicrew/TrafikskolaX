/**
 * API middleware utilities for standardized request/response handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { ApiResponse, createErrorResponse, createSuccessResponse, CommonErrors } from './types';

export type ApiHandler<T = unknown> = (
  req: NextRequest,
  context?: { params?: any }
) => Promise<ApiResponse<T>>;

export interface RouteOptions {
  requireAuth?: boolean;
  requiredRole?: 'student' | 'teacher' | 'admin';
  validate?: {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
  };
}

/**
 * Wraps API handlers with standardized error handling and response formatting
 */
export function withApiHandler<T>(
  handler: ApiHandler<T>,
  options: RouteOptions = {}
) {
  return async (req: NextRequest, context?: { params?: any }) => {
    try {
      // Authentication check
      if (options.requireAuth) {
        const user = getUserFromRequest(req);
        if (!user) {
          return NextResponse.json(CommonErrors.unauthorized(), { status: 401 });
        }

        // Role-based authorization
        if (options.requiredRole && user.role !== options.requiredRole) {
          return NextResponse.json(CommonErrors.forbidden(), { status: 403 });
        }

        // Add user to request context (for TypeScript, we'd need to extend the type)
        (req as any).user = user;
      }

      // Request validation
      if (options.validate) {
        const validationResult = await validateRequest(req, context?.params, options.validate);
        if (!validationResult.success) {
          return NextResponse.json(validationResult.error, { status: 400 });
        }
      }

      // Execute handler
      const result = await handler(req, context);

      // Return standardized response
      if (result.success) {
        return NextResponse.json(result, { status: 200 });
      } else {
        // Determine status code based on error type
        const statusCode = getStatusCodeFromError(result.error?.code);
        return NextResponse.json(result, { status: statusCode });
      }

    } catch (error) {
      console.error('API Handler Error:', error);
      
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const validationError = createErrorResponse(
          'VALIDATION_ERROR',
          'Request validation failed',
          error.errors
        );
        return NextResponse.json(validationError, { status: 400 });
      }

      // Generic error response
      const internalError = CommonErrors.internalError();
      return NextResponse.json(internalError, { status: 500 });
    }
  };
}

/**
 * Validates request data against Zod schemas
 */
async function validateRequest(
  req: NextRequest,
  params: any,
  validation: NonNullable<RouteOptions['validate']>
): Promise<{ success: true } | { success: false; error: ApiResponse<never> }> {
  try {
    // Validate body
    if (validation.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const body = await req.json();
      validation.body.parse(body);
    }

    // Validate params
    if (validation.params && params) {
      validation.params.parse(params);
    }

    // Validate query parameters
    if (validation.query) {
      const url = new URL(req.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      validation.query.parse(queryParams);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      const field = firstError.path.join('.');
      const message = `${field}: ${firstError.message}`;
      
      return {
        success: false,
        error: createErrorResponse('VALIDATION_ERROR', message, error.errors, field)
      };
    }
    
    return {
      success: false,
      error: CommonErrors.validationError('Invalid request data')
    };
  }
}

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCodeFromError(errorCode?: string): number {
  switch (errorCode) {
    case 'UNAUTHORIZED':
    case 'TOKEN_EXPIRED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'VALIDATION_ERROR':
    case 'MISSING_REQUIRED_FIELD':
    case 'INVALID_FORMAT':
      return 400;
    case 'ALREADY_EXISTS':
    case 'CONFLICT':
      return 409;
    case 'RATE_LIMIT_EXCEEDED':
      return 429;
    case 'INTERNAL_ERROR':
    case 'DATABASE_ERROR':
    case 'EXTERNAL_SERVICE_ERROR':
    default:
      return 500;
  }
}

/**
 * Helper to get authenticated user from request
 */
export function getAuthenticatedUser(req: NextRequest) {
  return (req as any).user || null;
}

/**
 * Create a quick success response helper
 */
export function jsonSuccess<T>(data: T, message?: string, status: number = 200) {
  return NextResponse.json(createSuccessResponse(data, message), { status });
}

/**
 * Create a quick error response helper
 */
export function jsonError(error: ApiResponse<never>['error'], status?: number) {
  const statusCode = status || getStatusCodeFromError(error?.code);
  return NextResponse.json({ success: false, error }, { status: statusCode });
}
