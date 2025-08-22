import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean, pgEnum, time, date, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Export email template schema
export * from './schema/email-templates';

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
  customerNumber: varchar('customer_number', { length: 20 }).unique(),
  isActive: boolean('is_active').notNull().default(true),
  profileImage: text('profile_image'),
  dateOfBirth: timestamp('date_of_birth'),
  licenseNumber: varchar('license_number', { length: 50 }), // For teachers
  specializations: text('specializations'), // JSON array of lesson types teacher can teach
  inskriven: boolean('inskriven').notNull().default(false),
  customPrice: decimal('custom_price', { precision: 10, scale: 2 }),
  inskrivenDate: timestamp('inskriven_date'),
  // Utbildningskort fields
  workplace: varchar('workplace', { length: 255 }),
  workPhone: varchar('work_phone', { length: 50 }),
  mobilePhone: varchar('mobile_phone', { length: 50 }),
  kkValidityDate: date('kk_validity_date'),
  riskEducation1: date('risk_education_1'),
  riskEducation2: date('risk_education_2'),
  knowledgeTest: date('knowledge_test'),
  drivingTest: date('driving_test'),
  notes: text('notes'),
  sendInternalMessagesToEmail: boolean('send_internal_messages_to_email').default(false),
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

// Bookings table (updated)
export const bookingsOld = pgTable('bookings_old', {
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

// New bookings table structure
export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  lessonTypeId: uuid('lesson_type_id').notNull().references(() => lessonTypes.id),
  scheduledDate: date('scheduled_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  transmissionType: varchar('transmission_type', { length: 20 }),
  teacherId: uuid('teacher_id').references(() => users.id),
  carId: uuid('car_id').references(() => cars.id),
  status: varchar('status', { length: 50 }).default('temp'), // temp, on_hold, confirmed, cancelled
  paymentStatus: varchar('payment_status', { length: 50 }).default('unpaid'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  // Guest booking fields
  isGuestBooking: boolean('is_guest_booking').default(false),
  guestName: varchar('guest_name', { length: 255 }),
  guestEmail: varchar('guest_email', { length: 255 }),
  guestPhone: varchar('guest_phone', { length: 50 }),
  // Completion and feedback
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  feedbackReady: boolean('feedback_ready').default(false),
  // Invoice tracking
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  invoiceDate: timestamp('invoice_date'),
  // Payment tracking
  swishUUID: varchar('swish_uuid', { length: 255 }),
  // Tracking
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // For soft deletes
});

// Slot settings for booking availability
export const slotSettings = pgTable('slot_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 1=Monday, etc.
  timeStart: time('time_start').notNull(),
  timeEnd: time('time_end').notNull(),
  isActive: boolean('is_active').default(true),
  adminMinutes: integer('admin_minutes').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Blocked slots for specific dates
export const blockedSlots = pgTable('blocked_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date').notNull(),
  timeStart: time('time_start'),
  timeEnd: time('time_end'),
  isAllDay: boolean('is_all_day').default(false),
  reason: text('reason'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Extra slots for specific dates
export const extraSlots = pgTable('extra_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date').notNull(),
  timeStart: time('time_start').notNull(),
  timeEnd: time('time_end').notNull(),
  reason: text('reason'),
  reservedForUserId: uuid('reserved_for_user_id').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Lesson types
export const lessonTypes = pgTable('lesson_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull().default(45),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  priceStudent: decimal('price_student', { precision: 10, scale: 2 }),
  salePrice: decimal('sale_price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Packages
export const packages = pgTable('packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  priceStudent: decimal('price_student', { precision: 10, scale: 2 }),
  salePrice: decimal('sale_price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Package contents
export const packageContents = pgTable('package_contents', {
  id: uuid('id').defaultRandom().primaryKey(),
  packageId: uuid('package_id').notNull().references(() => packages.id, { onDelete: 'cascade' }),
  lessonTypeId: uuid('lesson_type_id').references(() => lessonTypes.id, { onDelete: 'cascade' }),
  handledarSessionId: uuid('handledar_session_id').references(() => handledarSessions.id, { onDelete: 'cascade' }),
  credits: integer('credits').default(0),
  contentType: varchar('content_type', { length: 50 }).notNull().default('lesson'), // 'lesson', 'handledar', 'text'
  freeText: text('free_text'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User credits from packages
export const userCredits = pgTable('user_credits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonTypeId: uuid('lesson_type_id').references(() => lessonTypes.id),
  handledarSessionId: uuid('handledar_session_id').references(() => handledarSessions.id),
  creditsRemaining: integer('credits_remaining').notNull().default(0),
  creditsTotal: integer('credits_total').notNull().default(0),
  packageId: uuid('package_id').references(() => packages.id),
  creditType: varchar('credit_type', { length: 50 }).notNull().default('lesson'), // 'lesson' or 'handledar'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Booking Steps table - Swedish driving education curriculum
export const bookingSteps = pgTable('booking_steps', {
  id: serial('id').primaryKey(),
  stepNumber: integer('step_number').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  subcategory: varchar('subcategory', { length: 200 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Feedback table
export const userFeedback = pgTable('user_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  stepIdentifier: varchar('step_identifier', { length: 50 }), // References booking step
  feedbackText: text('feedback_text'),
  rating: integer('rating'), // 1-5 scale for general rating
  valuation: integer('valuation'), // 1-10 scale for teacher step assessment
  isFromTeacher: boolean('is_from_teacher').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Booking plan items (planned steps per booking)
export const bookingPlanItems = pgTable('booking_plan_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
  stepIdentifier: varchar('step_identifier', { length: 50 }).notNull(),
  addedBy: uuid('added_by').references(() => users.id),
  isSelected: boolean('is_selected').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Internal Messages table
export const internalMessages = pgTable('internal_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromUserId: uuid('from_user_id').references(() => users.id).notNull(),
  toUserId: uuid('to_user_id').references(() => users.id).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  bookingId: uuid('booking_id').references(() => bookings.id), // Optional reference to booking
  messageType: varchar('message_type', { length: 50 }).default('general'), // general, payment_confirmation, booking_related
  createdAt: timestamp('created_at').notNull().defaultNow(),
  readAt: timestamp('read_at'),
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
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
    relationName: 'studentBookings',
  }),
  teacher: one(users, {
    fields: [bookings.teacherId],
    references: [users.id],
    relationName: 'teacherBookings',
  }),
  lessonType: one(lessonTypes, {
    fields: [bookings.lessonTypeId],
    references: [lessonTypes.id],
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

// Site settings table
export const siteSettings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value'),
  description: text('description'),
  category: varchar('category', { length: 100 }), // 'general', 'email', 'payment', 'booking'
  isEnv: boolean('is_env').default(false), // true if it's an env variable
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Qliro orders table for tracking payment orders
export const qliroOrders = pgTable('qliro_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  handledarBookingId: uuid('handledar_booking_id').references(() => handledarBookings.id, { onDelete: 'cascade' }),
  packagePurchaseId: uuid('package_purchase_id').references(() => packagePurchases.id, { onDelete: 'cascade' }),
  qliroOrderId: varchar('qliro_order_id', { length: 255 }).notNull().unique(),
  merchantReference: varchar('merchant_reference', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('SEK'),
  status: varchar('status', { length: 50 }).default('created'), // created, pending, completed, failed, cancelled
  paymentLink: text('payment_link'),
  lastStatusCheck: timestamp('last_status_check'),
  environment: varchar('environment', { length: 20 }).default('sandbox'), // sandbox, production
  // Dynamic callback token for webhook authentication (defense-in-depth)
  callbackToken: varchar('callback_token', { length: 255 }),
  callbackTokenExpiresAt: timestamp('callback_token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


// Teori lesson types table
export const teoriLessonTypes = pgTable('teori_lesson_types', {
  id: uuid('id').defaultRandom().primaryKey(),
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

// Teori sessions table (similar to handledarSessions)
export const teoriSessions = pgTable('teori_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonTypeId: uuid('lesson_type_id').notNull().references(() => teoriLessonTypes.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  maxParticipants: integer('max_participants').default(1),
  currentParticipants: integer('current_participants').default(0),
  teacherId: uuid('teacher_id').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teori bookings table (similar to handledarBookings but for students)
export const teoriBookings = pgTable('teori_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => teoriSessions.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  swishUuid: varchar('swish_uuid', { length: 255 }),
  bookedBy: uuid('booked_by').references(() => users.id),
  reminderSent: boolean('reminder_sent').default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teori supervisors table (for types that allow supervisors)
export const teoriSupervisors = pgTable('teori_supervisors', {
  id: uuid('id').defaultRandom().primaryKey(),
  teoriBookingId: uuid('teori_booking_id').notNull().references(() => teoriBookings.id, { onDelete: 'cascade' }),
  supervisorName: varchar('supervisor_name', { length: 255 }).notNull(),
  supervisorEmail: varchar('supervisor_email', { length: 255 }),
  supervisorPhone: varchar('supervisor_phone', { length: 50 }),
  supervisorPersonalNumber: varchar('supervisor_personal_number', { length: 20 }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Handledar sessions table
export const handledarSessions = pgTable('handledar_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  maxParticipants: integer('max_participants').default(2),
  currentParticipants: integer('current_participants').default(0),
  pricePerParticipant: decimal('price_per_participant', { precision: 10, scale: 2 }).notNull(),
  teacherId: uuid('teacher_id').references(() => users.id),
  isActive: boolean('is_active').default(true),
  sessionType: varchar('session_type', { length: 50 }).default('handledarutbildning'), // 'handledarutbildning' or 'riskettan'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Handledar bookings table
export const handledarBookings = pgTable('handledar_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => handledarSessions.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').references(() => users.id),
  supervisorName: varchar('supervisor_name', { length: 255 }).notNull(),
  supervisorEmail: varchar('supervisor_email', { length: 255 }),
  supervisorPhone: varchar('supervisor_phone', { length: 50 }),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).default('500.00'),
  supervisorCount: integer('supervisor_count').default(1),
  pricePerSupervisor: decimal('price_per_supervisor', { precision: 10, scale: 2 }).default('500.00'),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  swishUuid: varchar('swish_uuid', { length: 255 }),
  bookedBy: uuid('booked_by').references(() => users.id),
  reminderSent: boolean('reminder_sent').default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Supervisor details table for multiple supervisors per booking
export const supervisorDetails = pgTable('supervisor_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  handledarBookingId: uuid('handledar_booking_id').notNull().references(() => handledarBookings.id, { onDelete: 'cascade' }),
  supervisorName: varchar('supervisor_name', { length: 255 }).notNull(),
  supervisorEmail: varchar('supervisor_email', { length: 255 }),
  supervisorPhone: varchar('supervisor_phone', { length: 50 }),
  supervisorPersonalNumber: varchar('supervisor_personal_number', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Slot overrides table
export const slotOverrides = pgTable('slot_overrides', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date').notNull(),
  timeStart: time('time_start').notNull(),
  timeEnd: time('time_end').notNull(),
  reason: text('reason'),
  isAvailable: boolean('is_available').default(true), // false means blocked
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Package purchases table
export const packagePurchases = pgTable('package_purchases', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  packageId: uuid('package_id').notNull().references(() => packages.id),
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  pricePaid: decimal('price_paid', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  // Newly added fields for Qliro admin features
  paidAt: timestamp('paid_at'),
  paymentReference: varchar('payment_reference', { length: 255 }),
  userEmail: varchar('user_email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Handledar sessions relations
export const handledarSessionsRelations = relations(handledarSessions, ({ one, many }) => ({
  teacher: one(users, {
    fields: [handledarSessions.teacherId],
    references: [users.id],
  }),
  bookings: many(handledarBookings),
}));

// Teori lesson types relations
export const teoriLessonTypesRelations = relations(teoriLessonTypes, ({ many }) => ({
  sessions: many(teoriSessions),
}));

// Teori sessions relations
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

// Teori bookings relations
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

// Teori supervisors relations
export const teoriSupervisorsRelations = relations(teoriSupervisors, ({ one }) => ({
  booking: one(teoriBookings, {
    fields: [teoriSupervisors.teoriBookingId],
    references: [teoriBookings.id],
  }),
}));

// Handledar bookings relations
export const handledarBookingsRelations = relations(handledarBookings, ({ one }) => ({
  session: one(handledarSessions, {
    fields: [handledarBookings.sessionId],
    references: [handledarSessions.id],
  }),
  student: one(users, {
    fields: [handledarBookings.studentId],
    references: [users.id],
  }),
  bookedBy: one(users, {
    fields: [handledarBookings.bookedBy],
    references: [users.id],
  }),
}));

// Package relations
export const packagesRelations = relations(packages, ({ many }) => ({
  contents: many(packageContents),
  purchases: many(packagePurchases),
}));

// Package contents relations
export const packageContentsRelations = relations(packageContents, ({ one }) => ({
  package: one(packages, {
    fields: [packageContents.packageId],
    references: [packages.id],
  }),
  lessonType: one(lessonTypes, {
    fields: [packageContents.lessonTypeId],
    references: [lessonTypes.id],
  }),
  handledarSession: one(handledarSessions, {
    fields: [packageContents.handledarSessionId],
    references: [handledarSessions.id],
  }),
}));

// Package purchases relations
export const packagePurchasesRelations = relations(packagePurchases, ({ one }) => ({
  user: one(users, {
    fields: [packagePurchases.userId],
    references: [users.id],
  }),
  package: one(packages, {
    fields: [packagePurchases.packageId],
    references: [packages.id],
  }),
}));

// Lesson types relations
export const lessonTypesRelations = relations(lessonTypes, ({ many }) => ({
  bookings: many(bookings),
  packageContents: many(packageContents),
  credits: many(userCredits),
}));

// User sessions table
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Messages table (alias for internalMessages)
export const messages = internalMessages;

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).default('info'), // info, warning, error, success
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User PDF reports metadata table
export const userReports = pgTable('user_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Original user this report belonged to (may be null if user removed)
  userId: uuid('user_id').references(() => users.id),
  // Who generated the report (admin)
  createdBy: uuid('created_by').references(() => users.id),
  // File information (stored on server, non-public)
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }).default('application/pdf'),
  // Redundant info for display even if user row is deleted
  deletedUserEmail: varchar('deleted_user_email', { length: 255 }),
  deletedUserName: varchar('deleted_user_name', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Lesson content groups and items
export const lessonContentGroups = pgTable('lesson_content_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lessonContentItems = pgTable('lesson_content_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').notNull().references(() => lessonContentGroups.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('SEK'),
  type: varchar('type', { length: 50 }).notNull(), // payment, refund, credit, debit
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  description: text('description'),
  externalId: varchar('external_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Payment history table
export const paymentHistory = pgTable('payment_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  transactionId: varchar('transaction_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Credit history table
export const creditHistory = pgTable('credit_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(), // Credits added/removed
  type: varchar('type', { length: 50 }).notNull(), // earned, purchased, used, expired
  description: text('description'),
  bookingId: uuid('booking_id').references(() => bookings.id),
  packageId: uuid('package_id').references(() => packages.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User packages table
export const userPackages = pgTable('user_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  packageId: uuid('package_id').references(() => packages.id).notNull(),
  creditsRemaining: integer('credits_remaining').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  purchasedAt: timestamp('purchased_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
