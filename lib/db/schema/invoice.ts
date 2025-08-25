import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../schema';

export const invoiceStatus = pgEnum('invoice_status', ['pending', 'paid', 'overdue', 'cancelled', 'error']);
export const invoiceType = pgEnum('invoice_type', ['booking', 'handledar', 'package', 'custom']);
export const paymentMethod = pgEnum('payment_method', ['swish', 'qliro', 'credits', 'cash', 'bank_transfer']);

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  type: invoiceType('type').notNull(), // booking, handledar, package, custom

  // Customer information
  customerId: uuid('customer_id').references(() => users.id), // Can be null for guest bookings
  customerEmail: varchar('customer_email', { length: 255 }),
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),

  // Invoice details
  description: text('description'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('SEK'),
  status: invoiceStatus('status').default('pending'),

  // Payment information
  paymentMethod: paymentMethod('payment_method'),
  swishUuid: varchar('swish_uuid', { length: 255 }),
  qliroOrderId: varchar('qliro_order_id', { length: 255 }),
  paymentReference: varchar('payment_reference', { length: 255 }),

  // Related entities
  bookingId: uuid('booking_id'), // Can reference different booking types
  sessionId: uuid('session_id'), // For new session system
  handledarBookingId: uuid('handledar_booking_id'), // Legacy handledar bookings
  packageId: uuid('package_id'), // For package purchases

  // Dates
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  lastReminderSent: timestamp('last_reminder_sent'),

  // Additional fields
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  isActive: boolean('is_active').default(true),
  reminderCount: integer('reminder_count').default(0),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),

  description: text('description').notNull(),
  quantity: integer('quantity').default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),

  // Optional reference to what this item represents
  itemType: varchar('item_type', { length: 50 }), // session, supervisor, etc.
  itemReference: uuid('item_reference'), // ID of the related item

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
