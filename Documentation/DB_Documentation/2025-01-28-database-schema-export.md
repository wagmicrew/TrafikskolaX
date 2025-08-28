# TrafikskolaX Database Schema Export - 2025-01-28

## Overview

This document contains the complete database schema for TrafikskolaX as exported from Drizzle ORM on 2025-01-28. It includes all tables, columns, relationships, and minimum required fields for inserts.

## Table Structure Summary

### Core Tables (Active)
- **users** - User accounts (students, teachers, admins)
- **bookings** - Main booking system for driving lessons
- **cars** - Vehicle fleet management
- **lesson_types** - Types of driving lessons
- **packages** - Lesson packages for purchase
- **invoices** - Payment and billing system

### Teori System Tables (Recommended)
- **teori_lesson_types** - Theoretical lesson types (includes handledar)
- **teori_sessions** - Theoretical sessions (unified teori/handledar)
- **teori_bookings** - Bookings for theoretical sessions
- **teori_supervisors** - Supervisor details for handledar sessions

### Legacy Tables (To Be Removed)
- **handledar_sessions** - Legacy handledar sessions
- **handledar_bookings** - Legacy handledar bookings
- **supervisor_details** - Legacy supervisor details
- **session_types** - Legacy session types
- **sessions** - Legacy sessions
- **session_bookings** - Legacy session bookings

---

## Detailed Table Specifications

### 1. users
**Purpose**: Core user management for students, teachers, and admins

**Columns**:
- `id` (uuid, PK) - Auto-generated UUID
- `email` (varchar(255), UNIQUE, NOT NULL) - User email address
- `password` (varchar(255), NOT NULL) - Hashed password
- `firstName` (varchar(100), NOT NULL) - First name
- `lastName` (varchar(100), NOT NULL) - Last name
- `phone` (varchar(20)) - Phone number
- `personalNumber` (varchar(12), UNIQUE) - Swedish personnummer
- `address` (text) - Street address
- `postalCode` (varchar(10)) - Postal code
- `city` (varchar(100)) - City
- `role` (user_role, NOT NULL, DEFAULT 'student') - User role enum
- `customerNumber` (varchar(20), UNIQUE) - Customer reference
- `isActive` (boolean, NOT NULL, DEFAULT true) - Account status
- `profileImage` (text) - Profile image path
- `dateOfBirth` (timestamp) - Birth date
- `licenseNumber` (varchar(50)) - Teacher license number
- `specializations` (text) - JSON array of teaching specializations
- `inskriven` (boolean, NOT NULL, DEFAULT false) - Enrolled status
- `customPrice` (decimal(10,2)) - Custom pricing
- `inskrivenDate` (timestamp) - Enrollment date
- `workplace` (varchar(255)) - Workplace
- `workPhone` (varchar(50)) - Work phone
- `mobilePhone` (varchar(50)) - Mobile phone
- `kkValidityDate` (date) - KK validity date
- `riskEducation1` (date) - Risk education 1 date
- `riskEducation2` (date) - Risk education 2 date
- `knowledgeTest` (date) - Knowledge test date
- `drivingTest` (date) - Driving test date
- `notes` (text) - Admin notes
- `sendInternalMessagesToEmail` (boolean, DEFAULT false) - Email preference
- `createdAt` (timestamp, NOT NULL, DEFAULT NOW()) - Creation timestamp
- `updatedAt` (timestamp, NOT NULL, DEFAULT NOW()) - Update timestamp

**Required for Insert**: `email`, `password`, `firstName`, `lastName`, `role`

**Relationships**:
- One-to-many with `bookings` (as student and teacher)
- One-to-many with `user_credits`
- One-to-many with `teacher_availability`

---

### 2. teori_lesson_types
**Purpose**: Defines types of theoretical lessons (includes handledar training)

**Columns**:
- `id` (uuid, PK) - Auto-generated UUID
- `name` (varchar(255), NOT NULL) - Lesson type name
- `description` (text) - Detailed description
- `allowsSupervisors` (boolean, DEFAULT false) - Whether supervisors are allowed
- `price` (decimal(10,2), NOT NULL) - Base price
- `pricePerSupervisor` (decimal(10,2)) - Price per supervisor
- `durationMinutes` (integer, DEFAULT 60) - Duration in minutes
- `maxParticipants` (integer, DEFAULT 1) - Maximum participants
- `isActive` (boolean, DEFAULT true) - Active status
- `sortOrder` (integer, DEFAULT 0) - Display order
- `createdAt` (timestamp, NOT NULL, DEFAULT NOW()) - Creation timestamp
- `updatedAt` (timestamp, NOT NULL, DEFAULT NOW()) - Update timestamp

**Required for Insert**: `name`, `price`

**Relationships**:
- One-to-many with `teori_sessions`

---

### 3. teori_sessions
**Purpose**: Actual theoretical sessions (unified for teori and handledar)

**Columns**:
- `id` (uuid, PK) - Auto-generated UUID
- `lessonTypeId` (uuid, NOT NULL, FK) - References teori_lesson_types.id
- `title` (varchar(255), NOT NULL) - Session title
- `description` (text) - Session description
- `date` (date, NOT NULL) - Session date
- `startTime` (time, NOT NULL) - Start time
- `endTime` (time, NOT NULL) - End time
- `maxParticipants` (integer, DEFAULT 1) - Maximum participants
- `currentParticipants` (integer, DEFAULT 0) - Current participant count
- `teacherId` (uuid, FK) - References users.id (teacher)
- `sessionType` (session_type_enum, DEFAULT 'teori') - Session type enum
- `price` (decimal(10,2)) - Session price
- `referenceId` (uuid) - Reference to original handledar session if migrated
- `isActive` (boolean, DEFAULT true) - Active status
- `createdAt` (timestamp, NOT NULL, DEFAULT NOW()) - Creation timestamp
- `updatedAt` (timestamp, NOT NULL, DEFAULT NOW()) - Update timestamp

**Required for Insert**: `lessonTypeId`, `title`, `date`, `startTime`, `endTime`

**Relationships**:
- Many-to-one with `teori_lesson_types`
- Many-to-one with `users` (teacher)
- One-to-many with `teori_bookings`

---

### 4. teori_bookings
**Purpose**: Bookings for theoretical sessions

**Columns**:
- `id` (uuid, PK) - Auto-generated UUID
- `sessionId` (uuid, NOT NULL, FK) - References teori_sessions.id
- `studentId` (uuid, NOT NULL, FK) - References users.id (student)
- `status` (varchar(50), DEFAULT 'pending') - Booking status
- `price` (decimal(10,2), NOT NULL) - Booking price
- `paymentStatus` (varchar(50), DEFAULT 'pending') - Payment status
- `paymentMethod` (varchar(50)) - Payment method used
- `swishUuid` (varchar(255)) - Swish payment UUID
- `bookedBy` (uuid, FK) - References users.id (who made the booking)
- `reminderSent` (boolean, DEFAULT false) - Reminder email status
- `participantName` (varchar(255)) - Participant name (for handledar)
- `participantEmail` (varchar(255)) - Participant email (for handledar)
- `participantPhone` (varchar(50)) - Participant phone (for handledar)
- `participantPersonalNumber` (varchar(20)) - Participant personal number
- `createdAt` (timestamp, NOT NULL, DEFAULT NOW()) - Creation timestamp
- `updatedAt` (timestamp, NOT NULL, DEFAULT NOW()) - Update timestamp

**Required for Insert**: `sessionId`, `studentId`, `price`

**Relationships**:
- Many-to-one with `teori_sessions`
- Many-to-one with `users` (student)
- Many-to-one with `users` (bookedBy)
- One-to-many with `teori_supervisors`

---

### 5. teori_supervisors
**Purpose**: Supervisor details for handledar sessions

**Columns**:
- `id` (uuid, PK) - Auto-generated UUID
- `teoriBookingId` (uuid, NOT NULL, FK) - References teori_bookings.id
- `supervisorName` (varchar(255), NOT NULL) - Supervisor name
- `supervisorEmail` (varchar(255)) - Supervisor email
- `supervisorPhone` (varchar(50)) - Supervisor phone
- `supervisorPersonalNumber` (varchar(20)) - Supervisor personal number
- `price` (decimal(10,2), NOT NULL) - Supervisor price
- `createdAt` (timestamp, NOT NULL, DEFAULT NOW()) - Creation timestamp

**Required for Insert**: `teoriBookingId`, `supervisorName`, `price`

**Relationships**:
- Many-to-one with `teori_bookings`

---

### 6. bookings
**Purpose**: Main booking system for driving lessons

**Columns**:
- `id` (uuid, PK) - Auto-generated UUID
- `userId` (uuid, FK) - References users.id (student)
- `lessonTypeId` (uuid, NOT NULL, FK) - References lesson_types.id
- `scheduledDate` (date, NOT NULL) - Lesson date
- `startTime` (time, NOT NULL) - Start time
- `endTime` (time, NOT NULL) - End time
- `durationMinutes` (integer, NOT NULL) - Duration in minutes
- `transmissionType` (varchar(20)) - Manual/automatic
- `teacherId` (uuid, FK) - References users.id (teacher)
- `carId` (uuid, FK) - References cars.id
- `status` (varchar(50), DEFAULT 'temp') - Booking status
- `paymentStatus` (varchar(50), DEFAULT 'unpaid') - Payment status
- `paymentMethod` (varchar(50)) - Payment method
- `totalPrice` (decimal(10,2), NOT NULL) - Total price
- `notes` (text) - Booking notes
- `isGuestBooking` (boolean, DEFAULT false) - Guest booking flag
- `guestName` (varchar(255)) - Guest name
- `guestEmail` (varchar(255)) - Guest email
- `guestPhone` (varchar(50)) - Guest phone
- `isCompleted` (boolean, DEFAULT false) - Completion status
- `completedAt` (timestamp) - Completion timestamp
- `feedbackReady` (boolean, DEFAULT false) - Feedback ready flag
- `invoiceNumber` (varchar(100)) - Invoice number
- `invoiceDate` (timestamp) - Invoice date
- `swishUUID` (varchar(255)) - Swish payment UUID
- `createdAt` (timestamp, NOT NULL, DEFAULT NOW()) - Creation timestamp
- `updatedAt` (timestamp, NOT NULL, DEFAULT NOW()) - Update timestamp
- `deletedAt` (timestamp) - Soft delete timestamp

**Required for Insert**: `lessonTypeId`, `scheduledDate`, `startTime`, `endTime`, `durationMinutes`, `totalPrice`

**Relationships**:
- Many-to-one with `users` (student and teacher)
- Many-to-one with `lesson_types`
- Many-to-one with `cars`

---

### 7. lesson_types
**Purpose**: Types of driving lessons

**Columns**:
- `id` (uuid, PK) - Auto-generated UUID
- `name` (varchar(255), NOT NULL) - Lesson type name
- `description` (text) - Description
- `durationMinutes` (integer, NOT NULL, DEFAULT 45) - Duration in minutes
- `price` (decimal(10,2), NOT NULL) - Base price
- `priceStudent` (decimal(10,2)) - Student price
- `salePrice` (decimal(10,2)) - Sale price
- `isActive` (boolean, DEFAULT true) - Active status
- `createdAt` (timestamp, NOT NULL, DEFAULT NOW()) - Creation timestamp
- `updatedAt` (timestamp, NOT NULL, DEFAULT NOW()) - Update timestamp

**Required for Insert**: `name`, `durationMinutes`, `price`

**Relationships**:
- One-to-many with `bookings`
- One-to-many with `package_contents`

---

### 8. cars
**Purpose**: Vehicle fleet management

**Columns**:
- `id` (uuid, PK) - Auto-generated UUID
- `name` (varchar(100), NOT NULL) - Custom car name
- `brand` (varchar(50), NOT NULL) - Car brand
- `model` (varchar(50), NOT NULL) - Car model
- `year` (integer) - Manufacturing year
- `color` (varchar(30)) - Car color
- `transmission` (transmission, NOT NULL) - Manual/automatic enum
- `licensePlate` (varchar(10), UNIQUE) - License plate
- `isActive` (boolean, NOT NULL, DEFAULT true) - Active status
- `features` (text) - JSON array of features
- `createdAt` (timestamp, NOT NULL, DEFAULT NOW()) - Creation timestamp
- `updatedAt` (timestamp, NOT NULL, DEFAULT NOW()) - Update timestamp

**Required for Insert**: `name`, `brand`, `model`, `transmission`

**Relationships**:
- One-to-many with `bookings`

---

### 9. invoices
**Purpose**: Payment and billing system

**Columns**:
- `id` (uuid, PK) - Auto-generated UUID
- `invoice_number` (varchar(100), UNIQUE, NOT NULL) - Invoice number
- `type` (varchar(50), NOT NULL) - Invoice type
- `customer_name` (varchar(255), NOT NULL) - Customer name
- `customer_email` (varchar(255), NOT NULL) - Customer email
- `amount` (decimal(10,2), NOT NULL) - Invoice amount
- `currency` (varchar(3), DEFAULT 'SEK') - Currency code
- `status` (varchar(50), DEFAULT 'pending') - Invoice status
- `user_id` (uuid, FK) - References users.id
- `booking_id` (uuid, FK) - References bookings.id
- `package_id` (uuid, FK) - References packages.id
- `issued_at` (varchar(255), NOT NULL) - Issue date
- `due_date` (varchar(255), NOT NULL) - Due date
- `paid_at` (varchar(255)) - Payment date
- `payment_method` (varchar(50)) - Payment method
- `betalhubben_url` (text) - Payment hub URL
- `created_at` (timestamp, NOT NULL, DEFAULT NOW()) - Creation timestamp
- `updated_at` (timestamp, NOT NULL, DEFAULT NOW()) - Update timestamp

**Required for Insert**: `invoice_number`, `type`, `customer_name`, `customer_email`, `amount`, `issued_at`, `due_date`

**Relationships**:
- Many-to-one with `users`
- Many-to-one with `bookings`
- Many-to-one with `packages`

---

## Enums

### user_role
- `student`
- `teacher` 
- `admin`

### transmission
- `manual`
- `automatic`

### lesson_type
- `b_license`
- `a_license`
- `taxi_license`
- `assessment`
- `theory`

### payment_status
- `pending`
- `paid`
- `failed`
- `refunded`

### session_type_enum
- `teori`
- `handledar`

---

## Key Relationships

### Booking Flow Relationships
1. **User** creates **Booking** for **Lesson Type**
2. **Booking** assigned to **Teacher** (User) and **Car**
3. **Booking** generates **Invoice** for payment
4. **Teori Booking** can have multiple **Teori Supervisors**

### Teori System Relationships
1. **Teori Lesson Type** defines session parameters
2. **Teori Session** is instance of lesson type
3. **Teori Booking** links user to session
4. **Teori Supervisors** linked to booking (for handledar sessions)

### Package System Relationships
1. **Package** contains multiple **Package Contents**
2. **User** purchases **Package** via **Package Purchase**
3. **User Credits** track remaining package credits

---

## Critical Foreign Key Constraints

### Must Exist Before Insert
- `bookings.lessonTypeId` → `lesson_types.id`
- `bookings.userId` → `users.id`
- `teori_sessions.lessonTypeId` → `teori_lesson_types.id`
- `teori_bookings.sessionId` → `teori_sessions.id`
- `teori_bookings.studentId` → `users.id`
- `teori_supervisors.teoriBookingId` → `teori_bookings.id`

### Cascade Delete Relationships
- Delete `teori_lesson_types` → cascades to `teori_sessions`
- Delete `teori_sessions` → cascades to `teori_bookings`
- Delete `teori_bookings` → cascades to `teori_supervisors`
- Delete `users` → cascades to related bookings and credits

---

## Indexes (Performance Critical)

### Recommended Indexes
- `users.email` (unique)
- `users.personal_number` (unique)
- `bookings.scheduled_date`
- `bookings.user_id`
- `bookings.lesson_type_id`
- `teori_sessions.date`
- `teori_sessions.lesson_type_id`
- `teori_bookings.session_id`
- `teori_bookings.student_id`

---

## Data Validation Rules

### Required Fields Summary
- **users**: email, password, firstName, lastName, role
- **teori_lesson_types**: name, price
- **teori_sessions**: lessonTypeId, title, date, startTime, endTime
- **teori_bookings**: sessionId, studentId, price
- **teori_supervisors**: teoriBookingId, supervisorName, price
- **bookings**: lessonTypeId, scheduledDate, startTime, endTime, durationMinutes, totalPrice
- **lesson_types**: name, durationMinutes, price
- **cars**: name, brand, model, transmission
- **invoices**: invoice_number, type, customer_name, customer_email, amount, issued_at, due_date
