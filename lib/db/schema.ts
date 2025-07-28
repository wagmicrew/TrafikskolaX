import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['student', 'teacher', 'admin']);
export const transmissionEnum = pgEnum('transmission', ['manual', 'automatic']);
export const lessonTypeEnum = pgEnum('lesson_type', ['b_license', 'a_license', 'taxi_license', 'assessment', 'theory']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // Hashed password
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  personalNumber: varchar('personal_number', { length: 12 }).unique(), // Swedish personnummer
  address: text('address'),
  postalCode: varchar('postal_code', { length: 10 }),
  city: varchar('city', { length: 100 }),
  role: userRoleEnum('role').notNull().default('student'),
  isActive: boolean('is_active').notNull().default(true),
  profileImage: text('profile_image'),
  dateOfBirth: timestamp('date_of_birth'),
  licenseNumber: varchar('license_number', { length: 50 }), // For teachers
  specializations: text('specializations'), // JSON array of lesson types teacher can teach
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Cars table
export const cars = pgTable('cars', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(), // Custom name like "BMW 1"
  brand: varchar('brand', { length: 50 }).notNull(),
  model: varchar('model', { length: 50 }).notNull(),
  year: integer('year'),
  color: varchar('color', { length: 30 }),
  transmission: transmissionEnum('transmission').notNull(),
  licensePlate: varchar('license_plate', { length: 10 }).unique(),
  isActive: boolean('is_active').notNull().default(true),
  features: text('features'), // JSON array of features
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Bookings table
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  teacherId: uuid('teacher_id').references(() => users.id),
  carId: uuid('car_id').references(() => cars.id),
  invoiceId: varchar('invoice_id', { length: 100 }),
  bookingDate: timestamp('booking_date').notNull(),
  duration: integer('duration').notNull().default(60), // minutes
  lessonType: lessonTypeEnum('lesson_type').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  notes: text('notes'),
  isCompleted: boolean('is_completed').notNull().default(false),
  isCancelled: boolean('is_cancelled').notNull().default(false),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// User Credits table
export const userCredits = pgTable('user_credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  lessonType: lessonTypeEnum('lesson_type').notNull(),
  credits: integer('credits').notNull().default(0),
  purchaseDate: timestamp('purchase_date'),
  expiryDate: timestamp('expiry_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// User Feedback table
export const userFeedback = pgTable('user_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  stepIdentifier: uuid('step_identifier').notNull(), // UUID for specific feedback step
  feedbackText: text('feedback_text').notNull(),
  rating: integer('rating'), // 1-5 scale
  isFromTeacher: boolean('is_from_teacher').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Teacher Availability table (bonus)
export const teacherAvailability = pgTable('teacher_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').references(() => users.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar('start_time', { length: 5 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 5 }).notNull(), // HH:MM format
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookingsAsStudent: many(bookings, { relationName: 'studentBookings' }),
  bookingsAsTeacher: many(bookings, { relationName: 'teacherBookings' }),
  credits: many(userCredits),
  feedback: many(userFeedback),
  availability: many(teacherAvailability),
}));

export const carsRelations = relations(cars, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  student: one(users, {
    fields: [bookings.studentId],
    references: [users.id],
    relationName: 'studentBookings',
  }),
  teacher: one(users, {
    fields: [bookings.teacherId],
    references: [users.id],
    relationName: 'teacherBookings',
  }),
  car: one(cars, {
    fields: [bookings.carId],
    references: [cars.id],
  }),
  feedback: many(userFeedback),
}));

export const userCreditsRelations = relations(userCredits, ({ one }) => ({
  user: one(users, {
    fields: [userCredits.userId],
    references: [users.id],
  }),
}));

export const userFeedbackRelations = relations(userFeedback, ({ one }) => ({
  booking: one(bookings, {
    fields: [userFeedback.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [userFeedback.userId],
    references: [users.id],
  }),
}));

export const teacherAvailabilityRelations = relations(teacherAvailability, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherAvailability.teacherId],
    references: [users.id],
  }),
}));
