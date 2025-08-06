import { pgTable, unique, uuid, varchar, text, boolean, timestamp, index, foreignKey, date, time, integer, numeric, serial, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const emailReceiverType = pgEnum("email_receiver_type", ['student', 'teacher', 'admin', 'specific_user'])
export const emailTriggerType = pgEnum("email_trigger_type", ['user_login', 'forgot_password', 'new_user', 'new_booking', 'moved_booking', 'cancelled_booking', 'booking_reminder', 'booking_confirmed', 'credits_reminder', 'payment_reminder', 'payment_confirmation_request', 'payment_confirmed', 'payment_declined', 'feedback_received', 'teacher_daily_bookings', 'teacher_feedback_reminder', 'awaiting_school_confirmation', 'pending_school_confirmation', 'new_password'])
export const lessonType = pgEnum("lesson_type", ['b_license', 'a_license', 'taxi_license', 'assessment', 'theory'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'paid', 'failed', 'refunded'])
export const transmission = pgEnum("transmission", ['manual', 'automatic'])
export const userRole = pgEnum("user_role", ['student', 'teacher', 'admin'])


export const siteSettings = pgTable("site_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: text(),
	description: text(),
	category: varchar({ length: 100 }),
	isEnv: boolean("is_env").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("site_settings_key_unique").on(table.key),
]);

export const slotOverrides = pgTable("slot_overrides", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: date().notNull(),
	timeStart: time("time_start").notNull(),
	timeEnd: time("time_end").notNull(),
	reason: text(),
	isAvailable: boolean("is_available").default(true),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_slot_overrides_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "slot_overrides_created_by_users_id_fk"
		}),
]);

export const bookingsOld = pgTable("bookings_old", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	teacherId: uuid("teacher_id"),
	carId: uuid("car_id"),
	invoiceId: varchar("invoice_id", { length: 100 }),
	bookingDate: timestamp("booking_date", { mode: 'string' }).notNull(),
	duration: integer().default(60).notNull(),
	lessonType: lessonType("lesson_type").notNull(),
	price: numeric({ precision: 10, scale:  2 }),
	paymentStatus: paymentStatus("payment_status").default('pending').notNull(),
	notes: text(),
	isCompleted: boolean("is_completed").default(false).notNull(),
	isCancelled: boolean("is_cancelled").default(false).notNull(),
	cancelReason: text("cancel_reason"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "bookings_old_student_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "bookings_old_teacher_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.carId],
			foreignColumns: [cars.id],
			name: "bookings_old_car_id_cars_id_fk"
		}),
]);

export const bookingSteps = pgTable("booking_steps", {
	id: serial().primaryKey().notNull(),
	stepNumber: integer("step_number").notNull(),
	category: varchar({ length: 100 }).notNull(),
	subcategory: varchar({ length: 200 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const handledarSessions = pgTable("handledar_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: date().notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	maxParticipants: integer("max_participants").default(2),
	currentParticipants: integer("current_participants").default(0),
	teacherId: uuid("teacher_id"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	pricePerParticipant: numeric("price_per_participant", { precision: 10, scale:  2 }).notNull(),
}, (table) => [
	index("idx_handledar_sessions_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "handledar_sessions_teacher_id_users_id_fk"
		}),
]);

export const bookings = pgTable("bookings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	lessonTypeId: uuid("lesson_type_id").notNull(),
	scheduledDate: date("scheduled_date").notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	durationMinutes: integer("duration_minutes").notNull(),
	transmissionType: varchar("transmission_type", { length: 20 }),
	teacherId: uuid("teacher_id"),
	status: varchar({ length: 50 }).default('temp'),
	paymentStatus: varchar("payment_status", { length: 50 }).default('unpaid'),
	paymentMethod: varchar("payment_method", { length: 50 }),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }).notNull(),
	notes: text(),
	isGuestBooking: boolean("is_guest_booking").default(false),
	guestName: varchar("guest_name", { length: 255 }),
	guestEmail: varchar("guest_email", { length: 255 }),
	guestPhone: varchar("guest_phone", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	isCompleted: boolean("is_completed").default(false),
	carId: uuid("car_id"),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	feedbackReady: boolean("feedback_ready").default(false),
	invoiceNumber: varchar("invoice_number", { length: 100 }),
	invoiceDate: timestamp("invoice_date", { mode: 'string' }),
	swishUuid: varchar("swish_uuid", { length: 255 }),
}, (table) => [
	index("idx_bookings_scheduled_date").using("btree", table.scheduledDate.asc().nullsLast().op("date_ops")),
	index("idx_bookings_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_bookings_teacher_id").using("btree", table.teacherId.asc().nullsLast().op("uuid_ops")),
	index("idx_bookings_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "bookings_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.lessonTypeId],
			foreignColumns: [lessonTypes.id],
			name: "bookings_lesson_type_id_lesson_types_id_fk"
		}),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "bookings_teacher_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.carId],
			foreignColumns: [cars.id],
			name: "bookings_car_id_cars_id_fk"
		}),
]);

export const handledarBookings = pgTable("handledar_bookings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	studentId: uuid("student_id"),
	supervisorName: varchar("supervisor_name", { length: 255 }).notNull(),
	supervisorEmail: varchar("supervisor_email", { length: 255 }),
	supervisorPhone: varchar("supervisor_phone", { length: 50 }),
	status: varchar({ length: 50 }).default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentStatus: varchar("payment_status", { length: 50 }).default('pending'),
	paymentMethod: varchar("payment_method", { length: 50 }),
	swishUuid: varchar("swish_uuid", { length: 255 }),
	bookedBy: uuid("booked_by"),
	reminderSent: boolean("reminder_sent").default(false),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [handledarSessions.id],
			name: "handledar_bookings_session_id_handledar_sessions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "handledar_bookings_student_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.bookedBy],
			foreignColumns: [users.id],
			name: "handledar_bookings_booked_by_users_id_fk"
		}),
]);

export const internalMessages = pgTable("internal_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fromUserId: uuid("from_user_id").notNull(),
	subject: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	messageType: varchar("message_type", { length: 50 }).default('general'),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	toUserId: uuid("to_user_id").notNull(),
	bookingId: uuid("booking_id"),
	readAt: timestamp("read_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.fromUserId],
			foreignColumns: [users.id],
			name: "internal_messages_from_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.toUserId],
			foreignColumns: [users.id],
			name: "internal_messages_to_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "internal_messages_booking_id_bookings_id_fk"
		}),
]);

export const cars = pgTable("cars", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	brand: varchar({ length: 50 }).notNull(),
	model: varchar({ length: 50 }).notNull(),
	year: integer(),
	color: varchar({ length: 30 }),
	transmission: transmission().notNull(),
	licensePlate: varchar("license_plate", { length: 10 }),
	isActive: boolean("is_active").default(true).notNull(),
	features: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("cars_license_plate_unique").on(table.licensePlate),
]);

export const teacherAvailability = pgTable("teacher_availability", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teacherId: uuid("teacher_id").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	startTime: varchar("start_time", { length: 5 }).notNull(),
	endTime: varchar("end_time", { length: 5 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "teacher_availability_teacher_id_users_id_fk"
		}),
]);

export const userFeedback = pgTable("user_feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	bookingId: uuid("booking_id").notNull(),
	userId: uuid("user_id").notNull(),
	stepIdentifier: varchar("step_identifier", { length: 50 }),
	feedbackText: text("feedback_text"),
	rating: integer(),
	isFromTeacher: boolean("is_from_teacher").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	valuation: integer(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_feedback_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "user_feedback_booking_id_bookings_id_fk"
		}),
]);

export const packagePurchases = pgTable("package_purchases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	packageId: uuid("package_id").notNull(),
	purchaseDate: timestamp("purchase_date", { mode: 'string' }).defaultNow().notNull(),
	pricePaid: numeric("price_paid", { precision: 10, scale:  2 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentStatus: varchar("payment_status", { length: 50 }).default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	invoiceNumber: varchar("invoice_number", { length: 100 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "package_purchases_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_purchases_package_id_packages_id_fk"
		}),
]);

export const emailTemplates = pgTable("email_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	triggerType: emailTriggerType("trigger_type").notNull(),
	subject: varchar({ length: 255 }).notNull(),
	htmlContent: text("html_content").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("email_templates_trigger_type_unique").on(table.triggerType),
]);

export const emailTriggers = pgTable("email_triggers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	templateId: uuid("template_id").notNull(),
	triggerType: emailTriggerType("trigger_type").notNull(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [emailTemplates.id],
			name: "email_triggers_template_id_email_templates_id_fk"
		}),
]);

export const emailReceivers = pgTable("email_receivers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	templateId: uuid("template_id").notNull(),
	receiverType: emailReceiverType("receiver_type").notNull(),
	specificUserId: uuid("specific_user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [emailTemplates.id],
			name: "email_receivers_template_id_email_templates_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	phone: varchar({ length: 20 }),
	personalNumber: varchar("personal_number", { length: 12 }),
	address: text(),
	postalCode: varchar("postal_code", { length: 10 }),
	city: varchar({ length: 100 }),
	role: userRole().default('student').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	profileImage: text("profile_image"),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	licenseNumber: varchar("license_number", { length: 50 }),
	specializations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	password: varchar({ length: 255 }).notNull(),
	inskriven: boolean().default(false).notNull(),
	inskrivenDate: timestamp("inskriven_date", { mode: 'string' }),
	customPrice: numeric("custom_price", { precision: 10, scale:  2 }),
	workplace: varchar({ length: 255 }),
	workPhone: varchar("work_phone", { length: 50 }),
	mobilePhone: varchar("mobile_phone", { length: 50 }),
	kkValidityDate: date("kk_validity_date"),
	riskEducation1: date("risk_education_1"),
	riskEducation2: date("risk_education_2"),
	knowledgeTest: date("knowledge_test"),
	drivingTest: date("driving_test"),
	notes: text(),
	sendInternalMessagesToEmail: boolean("send_internal_messages_to_email").default(false),
	customerNumber: varchar("customer_number", { length: 20 }),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_personal_number_unique").on(table.personalNumber),
	unique("users_customer_number_unique").on(table.customerNumber),
]);

export const packageContents = pgTable("package_contents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	packageId: uuid("package_id").notNull(),
	lessonTypeId: uuid("lesson_type_id"),
	credits: integer().default(0),
	freeText: text("free_text"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	handledarSessionId: uuid("handledar_session_id"),
	contentType: varchar("content_type", { length: 50 }).default('lesson').notNull(),
	sortOrder: integer("sort_order").default(0),
}, (table) => [
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_contents_package_id_packages_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.lessonTypeId],
			foreignColumns: [lessonTypes.id],
			name: "package_contents_lesson_type_id_lesson_types_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.handledarSessionId],
			foreignColumns: [handledarSessions.id],
			name: "package_contents_handledar_session_id_handledar_sessions_id_fk"
		}).onDelete("cascade"),
]);

export const blockedSlots = pgTable("blocked_slots", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: date().notNull(),
	timeStart: time("time_start"),
	timeEnd: time("time_end"),
	isAllDay: boolean("is_all_day").default(false),
	reason: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "blocked_slots_created_by_users_id_fk"
		}),
]);

export const packages = pgTable("packages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	priceStudent: numeric("price_student", { precision: 10, scale:  2 }),
	salePrice: numeric("sale_price", { precision: 10, scale:  2 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const lessonTypes = pgTable("lesson_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	durationMinutes: integer("duration_minutes").default(45).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	priceStudent: numeric("price_student", { precision: 10, scale:  2 }),
	salePrice: numeric("sale_price", { precision: 10, scale:  2 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("lesson_types_name_key").on(table.name),
]);

export const slotSettings = pgTable("slot_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	timeStart: time("time_start").notNull(),
	timeEnd: time("time_end").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	adminMinutes: integer("admin_minutes").default(0),
});

export const userCredits = pgTable("user_credits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	lessonTypeId: uuid("lesson_type_id"),
	creditsRemaining: integer("credits_remaining").default(0).notNull(),
	creditsTotal: integer("credits_total").default(0).notNull(),
	packageId: uuid("package_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	handledarSessionId: uuid("handledar_session_id"),
	creditType: varchar("credit_type", { length: 50 }).default('lesson').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_credits_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.lessonTypeId],
			foreignColumns: [lessonTypes.id],
			name: "user_credits_lesson_type_id_lesson_types_id_fk"
		}),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "user_credits_package_id_packages_id_fk"
		}),
	foreignKey({
			columns: [table.handledarSessionId],
			foreignColumns: [handledarSessions.id],
			name: "user_credits_handledar_session_id_handledar_sessions_id_fk"
		}),
]);
