/**
 * Zod validation schemas for API routes
 */

import { z } from 'zod';

// Common validation patterns
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format');
export const uuidSchema = z.string().uuid('Invalid UUID format');

// User schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: phoneSchema.optional(),
  role: z.enum(['student', 'teacher']).default('student')
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: phoneSchema.optional(),
  profileImage: z.string().url().optional()
});

// Booking schemas
export const createBookingSchema = z.object({
  lessonTypeId: uuidSchema,
  studentId: uuidSchema,
  teacherId: uuidSchema,
  scheduledAt: z.string().datetime('Invalid datetime format'),
  notes: z.string().max(500).optional(),
  location: z.string().max(100).optional()
});

export const updateBookingSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  notes: z.string().max(500).optional(),
  location: z.string().max(100).optional()
});

// Lesson type schemas
export const createLessonTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(15).max(480),
  price: z.string().regex(/^\d+(\.\d{2})?$/, 'Invalid price format'),
  priceStudent: z.string().regex(/^\d+(\.\d{2})?$/, 'Invalid price format').optional(),
  salePrice: z.string().regex(/^\d+(\.\d{2})?$/, 'Invalid price format').optional(),
  isActive: z.boolean().default(true)
});

export const updateLessonTypeSchema = createLessonTypeSchema.partial();

// Package schemas
export const createPackageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  price: z.string().regex(/^\d+(\.\d{2})?$/, 'Invalid price format'),
  priceStudent: z.string().regex(/^\d+(\.\d{2})?$/, 'Invalid price format').optional(),
  salePrice: z.string().regex(/^\d+(\.\d{2})?$/, 'Invalid price format').optional(),
  credits: z.number().int().min(1).max(1000),
  isActive: z.boolean().default(true)
});

export const updatePackageSchema = createPackageSchema.partial();

// Payment schemas
export const swishPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  message: z.string().max(50),
  phoneNumber: z.string().regex(/^46\d{8,9}$/, 'Invalid Swedish phone number'),
  purchaseId: uuidSchema
});

export const qliroPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('SEK'),
  purchaseId: uuidSchema,
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

// Credit management schemas
export const addCreditsSchema = z.object({
  userId: uuidSchema,
  credits: z.number().int().positive('Credits must be positive'),
  reason: z.string().min(1, 'Reason is required').max(200),
  expiresAt: z.string().datetime().optional()
});

export const deductCreditsSchema = z.object({
  userId: uuidSchema,
  credits: z.number().int().positive('Credits must be positive'),
  reason: z.string().min(1, 'Reason is required').max(200)
});

// Settings schemas
export const updateSettingsSchema = z.object({
  site_name: z.string().max(100).optional(),
  site_description: z.string().max(500).optional(),
  contact_email: emailSchema.optional(),
  contact_phone: phoneSchema.optional(),
  company_name: z.string().max(100).optional(),
  company_address: z.string().max(200).optional(),
  smtp_host: z.string().max(100).optional(),
  smtp_port: z.number().int().min(1).max(65535).optional(),
  smtp_user: z.string().max(100).optional(),
  smtp_pass: z.string().max(100).optional(),
  sendgrid_api_key: z.string().max(200).optional(),
  swish_number: z.string().regex(/^\d{10,12}$/, 'Invalid Swish number').optional(),
  qliro_merchant_id: z.string().max(100).optional(),
  qliro_api_key: z.string().max(200).optional(),
  google_maps_api_key: z.string().max(200).optional()
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const bookingFilterSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  teacherId: uuidSchema.optional(),
  studentId: uuidSchema.optional(),
  lessonTypeId: uuidSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
});

// File upload schemas
export const uploadFileSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp'])
});

// Feedback schemas
export const submitFeedbackSchema = z.object({
  bookingId: uuidSchema,
  rating: z.number().int().min(1).max(10),
  comment: z.string().max(1000).optional(),
  category: z.string().max(100).optional()
});

// Helper function to validate request data
export function validateRequestData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        success: false, 
        error: `${firstError.path.join('.')}: ${firstError.message}` 
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}
