import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean, time, date } from 'drizzle-orm/pg-core';
import { sessionTypes } from './session-types';
import { users } from '../schema';

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionTypeId: uuid('session_type_id').notNull().references(() => sessionTypes.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  maxParticipants: integer('max_participants').notNull().default(1),
  currentParticipants: integer('current_participants').notNull().default(0),
  teacherId: uuid('teacher_id').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
