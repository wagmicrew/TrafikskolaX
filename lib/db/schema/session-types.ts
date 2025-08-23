import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const sessionTypeEnum = pgEnum('session_type', ['handledarutbildning', 'riskettan', 'teorilektion', 'handledarkurs']);
export const creditTypeEnum = pgEnum('credit_type', ['handledarutbildning', 'riskettan', 'teorilektion', 'handledarkurs']);

export const sessionTypes = pgTable('session_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: sessionTypeEnum('type').notNull(), // handledarutbildning, riskettan, teorilektion, handledarkurs
  creditType: creditTypeEnum('credit_type').notNull(), // For credit system integration
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  pricePerSupervisor: decimal('price_per_supervisor', { precision: 10, scale: 2 }),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  maxParticipants: integer('max_participants').notNull().default(1),
  allowsSupervisors: boolean('allows_supervisors').default(false),
  requiresPersonalId: boolean('requires_personal_id').default(false),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
