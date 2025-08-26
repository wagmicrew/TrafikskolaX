import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean } from 'drizzle-orm/pg-core';
import { sessions } from './sessions';
import { users } from '../schema';

export const sessionBookings = pgTable('session_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').references(() => users.id), // Can be null for external participants
  supervisorName: varchar('supervisor_name', { length: 255 }),
  supervisorEmail: varchar('supervisor_email', { length: 255 }),
  supervisorPhone: varchar('supervisor_phone', { length: 50 }),
  supervisorPersonalNumber: text('supervisor_personal_number'), // Encrypted
  supervisorCount: integer('supervisor_count').default(1),
  status: varchar('status', { length: 50 }).default('pending'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }),
  pricePerSupervisor: decimal('price_per_supervisor', { precision: 10, scale: 2 }),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  swishUuid: varchar('swish_uuid', { length: 255 }),
  bookedBy: uuid('booked_by').references(() => users.id),
  reminderSent: boolean('reminder_sent').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
