import { pgTable, varchar, text, timestamp, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Email trigger types enum
export const emailTriggerEnum = pgEnum('email_trigger_type', [
  'user_login',
  'forgot_password',
  'new_user',
  'new_booking',
  'moved_booking',
  'cancelled_booking',
  'booking_reminder',
  'booking_confirmed',
  'credits_reminder',
  'payment_reminder',
  'payment_confirmation_request',
  'payment_confirmed',
  'payment_declined',
  'feedback_received',
  'teacher_daily_bookings',
  'teacher_feedback_reminder',
  'awaiting_school_confirmation',
  'pending_school_confirmation',
  'new_password'
]);

// Email receiver types enum
export const emailReceiverEnum = pgEnum('email_receiver_type', [
  'student',
  'teacher',
  'admin',
  'specific_user'
]);

// Email templates table
export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  triggerType: emailTriggerEnum('trigger_type').notNull().unique(),
  subject: varchar('subject', { length: 255 }).notNull(),
  htmlContent: text('html_content').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Email triggers table - defines when emails should be sent
export const emailTriggers = pgTable('email_triggers', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: uuid('template_id').references(() => emailTemplates.id).notNull(),
  triggerType: emailTriggerEnum('trigger_type').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Email receivers table - defines who receives the emails
export const emailReceivers = pgTable('email_receivers', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: uuid('template_id').references(() => emailTemplates.id).notNull(),
  receiverType: emailReceiverEnum('receiver_type').notNull(),
  specificUserId: uuid('specific_user_id'), // Optional, for specific user receivers
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const emailTemplatesRelations = relations(emailTemplates, ({ many }) => ({
  triggers: many(emailTriggers),
  receivers: many(emailReceivers),
}));

export const emailTriggersRelations = relations(emailTriggers, ({ one }) => ({
  template: one(emailTemplates, {
    fields: [emailTriggers.templateId],
    references: [emailTemplates.id],
  }),
}));

export const emailReceiversRelations = relations(emailReceivers, ({ one }) => ({
  template: one(emailTemplates, {
    fields: [emailReceivers.templateId],
    references: [emailTemplates.id],
  }),
}));
