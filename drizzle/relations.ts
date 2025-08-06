import { relations } from "drizzle-orm/relations";
import { users, slotOverrides, bookingsOld, cars, handledarSessions, bookings, lessonTypes, handledarBookings, internalMessages, teacherAvailability, userFeedback, packagePurchases, packages, emailTemplates, emailTriggers, emailReceivers, packageContents, blockedSlots, userCredits } from "./schema";

export const slotOverridesRelations = relations(slotOverrides, ({one}) => ({
	user: one(users, {
		fields: [slotOverrides.createdBy],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	slotOverrides: many(slotOverrides),
	bookingsOlds_studentId: many(bookingsOld, {
		relationName: "bookingsOld_studentId_users_id"
	}),
	bookingsOlds_teacherId: many(bookingsOld, {
		relationName: "bookingsOld_teacherId_users_id"
	}),
	handledarSessions: many(handledarSessions),
	bookings_userId: many(bookings, {
		relationName: "bookings_userId_users_id"
	}),
	bookings_teacherId: many(bookings, {
		relationName: "bookings_teacherId_users_id"
	}),
	handledarBookings_studentId: many(handledarBookings, {
		relationName: "handledarBookings_studentId_users_id"
	}),
	handledarBookings_bookedBy: many(handledarBookings, {
		relationName: "handledarBookings_bookedBy_users_id"
	}),
	internalMessages_fromUserId: many(internalMessages, {
		relationName: "internalMessages_fromUserId_users_id"
	}),
	internalMessages_toUserId: many(internalMessages, {
		relationName: "internalMessages_toUserId_users_id"
	}),
	teacherAvailabilities: many(teacherAvailability),
	userFeedbacks: many(userFeedback),
	packagePurchases: many(packagePurchases),
	blockedSlots: many(blockedSlots),
	userCredits: many(userCredits),
}));

export const bookingsOldRelations = relations(bookingsOld, ({one}) => ({
	user_studentId: one(users, {
		fields: [bookingsOld.studentId],
		references: [users.id],
		relationName: "bookingsOld_studentId_users_id"
	}),
	user_teacherId: one(users, {
		fields: [bookingsOld.teacherId],
		references: [users.id],
		relationName: "bookingsOld_teacherId_users_id"
	}),
	car: one(cars, {
		fields: [bookingsOld.carId],
		references: [cars.id]
	}),
}));

export const carsRelations = relations(cars, ({many}) => ({
	bookingsOlds: many(bookingsOld),
	bookings: many(bookings),
}));

export const handledarSessionsRelations = relations(handledarSessions, ({one, many}) => ({
	user: one(users, {
		fields: [handledarSessions.teacherId],
		references: [users.id]
	}),
	handledarBookings: many(handledarBookings),
	packageContents: many(packageContents),
	userCredits: many(userCredits),
}));

export const bookingsRelations = relations(bookings, ({one, many}) => ({
	user_userId: one(users, {
		fields: [bookings.userId],
		references: [users.id],
		relationName: "bookings_userId_users_id"
	}),
	lessonType: one(lessonTypes, {
		fields: [bookings.lessonTypeId],
		references: [lessonTypes.id]
	}),
	user_teacherId: one(users, {
		fields: [bookings.teacherId],
		references: [users.id],
		relationName: "bookings_teacherId_users_id"
	}),
	car: one(cars, {
		fields: [bookings.carId],
		references: [cars.id]
	}),
	internalMessages: many(internalMessages),
	userFeedbacks: many(userFeedback),
}));

export const lessonTypesRelations = relations(lessonTypes, ({many}) => ({
	bookings: many(bookings),
	packageContents: many(packageContents),
	userCredits: many(userCredits),
}));

export const handledarBookingsRelations = relations(handledarBookings, ({one}) => ({
	handledarSession: one(handledarSessions, {
		fields: [handledarBookings.sessionId],
		references: [handledarSessions.id]
	}),
	user_studentId: one(users, {
		fields: [handledarBookings.studentId],
		references: [users.id],
		relationName: "handledarBookings_studentId_users_id"
	}),
	user_bookedBy: one(users, {
		fields: [handledarBookings.bookedBy],
		references: [users.id],
		relationName: "handledarBookings_bookedBy_users_id"
	}),
}));

export const internalMessagesRelations = relations(internalMessages, ({one}) => ({
	user_fromUserId: one(users, {
		fields: [internalMessages.fromUserId],
		references: [users.id],
		relationName: "internalMessages_fromUserId_users_id"
	}),
	user_toUserId: one(users, {
		fields: [internalMessages.toUserId],
		references: [users.id],
		relationName: "internalMessages_toUserId_users_id"
	}),
	booking: one(bookings, {
		fields: [internalMessages.bookingId],
		references: [bookings.id]
	}),
}));

export const teacherAvailabilityRelations = relations(teacherAvailability, ({one}) => ({
	user: one(users, {
		fields: [teacherAvailability.teacherId],
		references: [users.id]
	}),
}));

export const userFeedbackRelations = relations(userFeedback, ({one}) => ({
	user: one(users, {
		fields: [userFeedback.userId],
		references: [users.id]
	}),
	booking: one(bookings, {
		fields: [userFeedback.bookingId],
		references: [bookings.id]
	}),
}));

export const packagePurchasesRelations = relations(packagePurchases, ({one}) => ({
	user: one(users, {
		fields: [packagePurchases.userId],
		references: [users.id]
	}),
	package: one(packages, {
		fields: [packagePurchases.packageId],
		references: [packages.id]
	}),
}));

export const packagesRelations = relations(packages, ({many}) => ({
	packagePurchases: many(packagePurchases),
	packageContents: many(packageContents),
	userCredits: many(userCredits),
}));

export const emailTriggersRelations = relations(emailTriggers, ({one}) => ({
	emailTemplate: one(emailTemplates, {
		fields: [emailTriggers.templateId],
		references: [emailTemplates.id]
	}),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({many}) => ({
	emailTriggers: many(emailTriggers),
	emailReceivers: many(emailReceivers),
}));

export const emailReceiversRelations = relations(emailReceivers, ({one}) => ({
	emailTemplate: one(emailTemplates, {
		fields: [emailReceivers.templateId],
		references: [emailTemplates.id]
	}),
}));

export const packageContentsRelations = relations(packageContents, ({one}) => ({
	package: one(packages, {
		fields: [packageContents.packageId],
		references: [packages.id]
	}),
	lessonType: one(lessonTypes, {
		fields: [packageContents.lessonTypeId],
		references: [lessonTypes.id]
	}),
	handledarSession: one(handledarSessions, {
		fields: [packageContents.handledarSessionId],
		references: [handledarSessions.id]
	}),
}));

export const blockedSlotsRelations = relations(blockedSlots, ({one}) => ({
	user: one(users, {
		fields: [blockedSlots.createdBy],
		references: [users.id]
	}),
}));

export const userCreditsRelations = relations(userCredits, ({one}) => ({
	user: one(users, {
		fields: [userCredits.userId],
		references: [users.id]
	}),
	lessonType: one(lessonTypes, {
		fields: [userCredits.lessonTypeId],
		references: [lessonTypes.id]
	}),
	package: one(packages, {
		fields: [userCredits.packageId],
		references: [packages.id]
	}),
	handledarSession: one(handledarSessions, {
		fields: [userCredits.handledarSessionId],
		references: [handledarSessions.id]
	}),
}));