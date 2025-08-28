import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean, pgEnum, time, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// Enums
export const sessionTypeEnum = pgEnum('session_type_enum', ['teori', 'handledar']);

// Teori lesson types table
export const teoriLessonTypes = pgTable('teori_lesson_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  allowsSupervisors: boolean('allows_supervisors').default(false),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  pricePerSupervisor: decimal('price_per_supervisor', { precision: 10, scale: 2 }),
  durationMinutes: integer('duration_minutes').default(60),
  maxParticipants: integer('max_participants').default(1),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teori sessions table (unified for both teori and handledar sessions)
export const teoriSessions = pgTable('teori_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonTypeId: uuid('lesson_type_id').notNull().references(() => teoriLessonTypes.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  maxParticipants: integer('max_participants').default(1),
  currentParticipants: integer('current_participants').default(0),
  teacherId: uuid('teacher_id').references(() => users.id),
  sessionType: sessionTypeEnum('session_type').default('teori'),
  price: decimal('price', { precision: 10, scale: 2 }),
  referenceId: uuid('reference_id'), // Reference to original handledar session if migrated
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teori bookings table
export const teoriBookings = pgTable('teori_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => teoriSessions.id),
  studentId: uuid('student_id').notNull().references(() => users.id),
  status: varchar('status', { length: 50 }).default('pending'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  swishUuid: varchar('swish_uuid', { length: 255 }),
  bookedBy: uuid('booked_by').references(() => users.id),
  reminderSent: boolean('reminder_sent').default(false),
  participantName: varchar('participant_name', { length: 255 }),
  participantEmail: varchar('participant_email', { length: 255 }),
  participantPhone: varchar('participant_phone', { length: 50 }),
  participantPersonalNumber: varchar('participant_personal_number', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teori supervisors table
export const teoriSupervisors = pgTable('teori_supervisors', {
  id: uuid('id').primaryKey().defaultRandom(),
  teoriBookingId: uuid('teori_booking_id').notNull().references(() => teoriBookings.id),
  supervisorName: varchar('supervisor_name', { length: 255 }).notNull(),
  supervisorEmail: varchar('supervisor_email', { length: 255 }),
  supervisorPhone: varchar('supervisor_phone', { length: 50 }),
  supervisorPersonalNumber: varchar('supervisor_personal_number', { length: 20 }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const teoriLessonTypesRelations = relations(teoriLessonTypes, ({ many }) => ({
  sessions: many(teoriSessions),
}));

export const teoriSessionsRelations = relations(teoriSessions, ({ one, many }) => ({
  lessonType: one(teoriLessonTypes, {
    fields: [teoriSessions.lessonTypeId],
    references: [teoriLessonTypes.id],
  }),
  teacher: one(users, {
    fields: [teoriSessions.teacherId],
    references: [users.id],
  }),
  bookings: many(teoriBookings),
}));

export const teoriBookingsRelations = relations(teoriBookings, ({ one, many }) => ({
  session: one(teoriSessions, {
    fields: [teoriBookings.sessionId],
    references: [teoriSessions.id],
  }),
  student: one(users, {
    fields: [teoriBookings.studentId],
    references: [users.id],
  }),
  bookedBy: one(users, {
    fields: [teoriBookings.bookedBy],
    references: [users.id],
  }),
  supervisors: many(teoriSupervisors),
}));

export const teoriSupervisorsRelations = relations(teoriSupervisors, ({ one }) => ({
  booking: one(teoriBookings, {
    fields: [teoriSupervisors.teoriBookingId],
    references: [teoriBookings.id],
  }),
}));
