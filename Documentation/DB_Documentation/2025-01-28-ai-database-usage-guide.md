# AI Database Usage Guide - TrafikskolaX - 2025-01-28

## Overview

This document provides AI-specific instructions for working with the TrafikskolaX database schema. It analyzes current code usage patterns and provides guidance for consistent database operations.

---

## Current Table Usage Analysis

### 1. Teori System (RECOMMENDED - Active Usage)

#### teori_lesson_types
**Files Using This Table**:
- `app/api/teori/sessions/route.ts` - Fetches lesson types with sessions
- `app/api/teori-sessions/route.ts` - Main API for unified teori/handledar sessions
- `components/booking/lesson-selection.tsx` - Displays lesson types in booking flow
- Multiple setup/migration scripts

**Common Usage Patterns**:
```typescript
// Fetch active lesson types with supervisor support
const lessonTypes = await db
  .select()
  .from(teoriLessonTypes)
  .where(eq(teoriLessonTypes.isActive, true))
  .orderBy(teoriLessonTypes.sortOrder, teoriLessonTypes.name);

// Create new lesson type
const newType = await db.insert(teoriLessonTypes).values({
  name: 'Handledarutbildning',
  description: 'Utbildning för handledare',
  allowsSupervisors: true,
  price: '500.00',
  pricePerSupervisor: '500.00',
  durationMinutes: 180,
  maxParticipants: 12,
  isActive: true,
  sortOrder: 1
}).returning();
```

#### teori_sessions
**Files Using This Table**:
- `app/api/teori/sessions/route.ts` - CRUD operations for sessions
- `app/api/teori-sessions/route.ts` - Public API for booking flow
- `app/api/teori-sessions/[id]/book/route.ts` - Session booking logic
- `components/booking/lesson-selection.tsx` - Session availability checks

**Common Usage Patterns**:
```typescript
// Fetch sessions with lesson type and booking count
const sessions = await db
  .select({
    id: teoriSessions.id,
    title: teoriSessions.title,
    date: teoriSessions.date,
    startTime: teoriSessions.startTime,
    endTime: teoriSessions.endTime,
    maxParticipants: teoriSessions.maxParticipants,
    currentParticipants: teoriSessions.currentParticipants,
    lessonTypeName: teoriLessonTypes.name,
    allowsSupervisors: teoriLessonTypes.allowsSupervisors,
    price: teoriLessonTypes.price,
    bookedCount: count(teoriBookings.id)
  })
  .from(teoriSessions)
  .innerJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
  .leftJoin(teoriBookings, and(
    eq(teoriSessions.id, teoriBookings.sessionId),
    sql`${teoriBookings.status} != 'cancelled'`
  ))
  .where(and(
    eq(teoriSessions.isActive, true),
    gte(teoriSessions.date, today)
  ))
  .groupBy(/* all non-aggregate columns */)
  .orderBy(teoriSessions.date, teoriSessions.startTime);
```

#### teori_bookings
**Files Using This Table**:
- `app/api/teori-sessions/[id]/book/route.ts` - Creates bookings
- `app/api/admin/migrate/handledar-to-teori/route.ts` - Migration logic
- Various admin and reporting endpoints

**Common Usage Patterns**:
```typescript
// Create teori booking
const booking = await db.insert(teoriBookings).values({
  sessionId: sessionId,
  studentId: userId,
  status: 'pending',
  price: totalPrice,
  paymentStatus: 'pending',
  paymentMethod: paymentMethod,
  participantName: participantName, // For handledar sessions
  participantEmail: participantEmail,
  participantPhone: participantPhone
}).returning();

// Check booking capacity
const bookingCount = await db
  .select({ count: count() })
  .from(teoriBookings)
  .where(and(
    eq(teoriBookings.sessionId, sessionId),
    sql`${teoriBookings.status} != 'cancelled'`
  ));
```

#### teori_supervisors
**Files Using This Table**:
- `app/api/teori-sessions/[id]/book/route.ts` - Creates supervisor records
- Migration and cleanup scripts

**Common Usage Patterns**:
```typescript
// Create supervisor record for handledar booking
const supervisor = await db.insert(teoriSupervisors).values({
  teoriBookingId: bookingId,
  supervisorName: supervisorName,
  supervisorEmail: supervisorEmail,
  supervisorPhone: supervisorPhone,
  supervisorPersonalNumber: supervisorPersonalNumber,
  price: supervisorPrice
}).returning();
```

### 2. Regular Booking System (Active)

#### bookings
**Files Using This Table**:
- `app/boka-korning/page.tsx` - Main booking flow
- `components/booking/booking-confirmation.tsx` - Booking creation
- `components/bookings/bookings-table.tsx` - Admin booking management
- Multiple API endpoints for booking CRUD

**Common Usage Patterns**:
```typescript
// Create regular driving lesson booking
const booking = await db.insert(bookings).values({
  userId: userId,
  lessonTypeId: lessonTypeId,
  scheduledDate: date,
  startTime: startTime,
  endTime: endTime,
  durationMinutes: duration,
  transmissionType: transmission,
  totalPrice: totalPrice,
  status: 'temp',
  paymentStatus: 'unpaid'
}).returning();

// Fetch user bookings with lesson type
const userBookings = await db
  .select()
  .from(bookings)
  .innerJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
  .where(eq(bookings.userId, userId))
  .orderBy(desc(bookings.scheduledDate));
```

#### lesson_types
**Files Using This Table**:
- `app/api/lesson-types/route.ts` - CRUD operations
- `components/booking/lesson-selection.tsx` - Displays driving lesson types
- Booking flow components

**Common Usage Patterns**:
```typescript
// Fetch active lesson types for booking
const lessonTypes = await db
  .select()
  .from(lessonTypes)
  .where(eq(lessonTypes.isActive, true))
  .orderBy(lessonTypes.name);

// Create lesson type
const newLessonType = await db.insert(lessonTypes).values({
  name: 'B-körkort',
  description: 'Grundläggande körlektion',
  durationMinutes: 45,
  price: '650.00',
  isActive: true
}).returning();
```

### 3. User Management (Active)

#### users
**Files Using This Table**:
- `app/api/auth/*` - Authentication system
- `lib/auth/server-auth.ts` - Server-side auth
- `contexts/AuthContext.tsx` - Client-side auth
- All booking and admin components

**Common Usage Patterns**:
```typescript
// Create user account
const user = await db.insert(users).values({
  email: email,
  password: hashedPassword,
  firstName: firstName,
  lastName: lastName,
  role: 'student',
  isActive: true
}).returning();

// Authenticate user
const user = await db
  .select()
  .from(users)
  .where(and(
    eq(users.email, email),
    eq(users.isActive, true)
  ))
  .limit(1);
```

### 4. Payment System (Active)

#### invoices
**Files Using This Table**:
- `app/api/invoices/*` - Invoice management
- `app/betalhubben/[id]/page.tsx` - Payment hub
- Payment confirmation flows

**Common Usage Patterns**:
```typescript
// Create invoice for booking
const invoice = await db.insert(invoices).values({
  invoice_number: invoiceNumber,
  type: 'booking',
  customer_name: `${user.firstName} ${user.lastName}`,
  customer_email: user.email,
  amount: totalPrice,
  currency: 'SEK',
  status: 'pending',
  user_id: user.id,
  booking_id: booking.id,
  issued_at: new Date().toISOString(),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}).returning();
```

---

## AI Instructions for Database Operations

### 1. Booking Flow Database Operations

**For Teori/Handledar Bookings**:
```typescript
// ALWAYS use teori_* tables for theoretical sessions
// 1. Check session availability
const session = await db
  .select({
    id: teoriSessions.id,
    maxParticipants: teoriSessions.maxParticipants,
    currentParticipants: teoriSessions.currentParticipants,
    allowsSupervisors: teoriLessonTypes.allowsSupervisors,
    bookedCount: count(teoriBookings.id)
  })
  .from(teoriSessions)
  .innerJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
  .leftJoin(teoriBookings, eq(teoriSessions.id, teoriBookings.sessionId))
  .where(eq(teoriSessions.id, sessionId))
  .groupBy(teoriSessions.id, teoriLessonTypes.id);

// 2. Create booking
const booking = await db.insert(teoriBookings).values({
  sessionId: sessionId,
  studentId: userId,
  status: 'pending',
  price: sessionPrice,
  // Include participant details for handledar sessions
  participantName: allowsSupervisors ? participantName : null,
  participantEmail: allowsSupervisors ? participantEmail : null
}).returning();

// 3. Add supervisors if handledar session
if (allowsSupervisors && supervisors.length > 0) {
  for (const supervisor of supervisors) {
    await db.insert(teoriSupervisors).values({
      teoriBookingId: booking.id,
      supervisorName: supervisor.name,
      supervisorEmail: supervisor.email,
      supervisorPhone: supervisor.phone,
      price: supervisorPrice
    });
  }
}
```

**For Regular Driving Lessons**:
```typescript
// Use bookings table for driving lessons
const booking = await db.insert(bookings).values({
  userId: userId,
  lessonTypeId: lessonTypeId,
  scheduledDate: date,
  startTime: startTime,
  endTime: endTime,
  durationMinutes: duration,
  totalPrice: totalPrice,
  status: 'temp'
}).returning();
```

### 2. Data Fetching Patterns

**Unified Session Fetching** (for lesson-selection component):
```typescript
// Fetch driving lessons
const drivingLessons = await db
  .select()
  .from(lessonTypes)
  .where(eq(lessonTypes.isActive, true));

// Fetch theoretical sessions (includes handledar)
const theoreticalSessions = await db
  .select({
    id: teoriLessonTypes.id,
    name: teoriLessonTypes.name,
    description: teoriLessonTypes.description,
    allowsSupervisors: teoriLessonTypes.allowsSupervisors,
    price: teoriLessonTypes.price,
    pricePerSupervisor: teoriLessonTypes.pricePerSupervisor,
    type: sql<string>`CASE WHEN ${teoriLessonTypes.allowsSupervisors} THEN 'handledar' ELSE 'teori' END`,
    availableSessions: count(teoriSessions.id)
  })
  .from(teoriLessonTypes)
  .leftJoin(teoriSessions, and(
    eq(teoriLessonTypes.id, teoriSessions.lessonTypeId),
    eq(teoriSessions.isActive, true),
    gte(teoriSessions.date, today)
  ))
  .where(eq(teoriLessonTypes.isActive, true))
  .groupBy(teoriLessonTypes.id)
  .orderBy(teoriLessonTypes.sortOrder);
```

### 3. Required Field Validation

**Before Creating Records**:
```typescript
// teori_lesson_types - REQUIRED: name, price
if (!name || !price) {
  throw new Error('Name and price are required for lesson types');
}

// teori_sessions - REQUIRED: lessonTypeId, title, date, startTime, endTime
if (!lessonTypeId || !title || !date || !startTime || !endTime) {
  throw new Error('Missing required fields for session creation');
}

// teori_bookings - REQUIRED: sessionId, studentId, price
if (!sessionId || !studentId || !price) {
  throw new Error('Missing required fields for booking creation');
}

// users - REQUIRED: email, password, firstName, lastName, role
if (!email || !password || !firstName || !lastName) {
  throw new Error('Missing required user fields');
}
```

### 4. Relationship Handling

**Always Join Related Tables**:
```typescript
// When fetching bookings, include related data
const bookingsWithDetails = await db
  .select({
    // Booking fields
    id: teoriBookings.id,
    status: teoriBookings.status,
    price: teoriBookings.price,
    // Session fields
    sessionTitle: teoriSessions.title,
    sessionDate: teoriSessions.date,
    sessionStartTime: teoriSessions.startTime,
    // Lesson type fields
    lessonTypeName: teoriLessonTypes.name,
    allowsSupervisors: teoriLessonTypes.allowsSupervisors,
    // User fields
    studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
    studentEmail: users.email
  })
  .from(teoriBookings)
  .innerJoin(teoriSessions, eq(teoriBookings.sessionId, teoriSessions.id))
  .innerJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
  .innerJoin(users, eq(teoriBookings.studentId, users.id))
  .where(eq(teoriBookings.status, 'confirmed'));
```

### 5. Error Handling Patterns

**Database Operation Error Handling**:
```typescript
try {
  const result = await db.insert(teoriBookings).values(bookingData).returning();
  return { success: true, booking: result[0] };
} catch (error) {
  console.error('Database error:', error);
  
  // Handle specific constraint violations
  if (error.code === '23505') { // Unique constraint violation
    return { success: false, error: 'Booking already exists' };
  }
  
  if (error.code === '23503') { // Foreign key violation
    return { success: false, error: 'Invalid session or user reference' };
  }
  
  return { success: false, error: 'Database operation failed' };
}
```

---

## Table Migration Status

### ✅ Use These Tables (Active & Recommended)
- `users` - User management
- `teori_lesson_types` - Theoretical lesson types
- `teori_sessions` - Theoretical sessions
- `teori_bookings` - Theoretical bookings
- `teori_supervisors` - Supervisor details
- `bookings` - Regular driving lesson bookings
- `lesson_types` - Driving lesson types
- `cars` - Vehicle management
- `invoices` - Payment system

### ⚠️ Legacy Tables (Avoid in New Code)
- `handledar_sessions` - Use `teori_sessions` instead
- `handledar_bookings` - Use `teori_bookings` instead
- `supervisor_details` - Use `teori_supervisors` instead
- `session_types` - Use `teori_lesson_types` instead
- `sessions` - Use `teori_sessions` instead
- `session_bookings` - Use `teori_bookings` instead

### 🚫 Deprecated Tables (Remove References)
- `pages` - CMS system (unused)
- `page_images` - CMS system (unused)
- `menu_items` - CMS system (unused)
- `internal_messages` - Use notifications instead
- `booking_supervisor_details` - Use teori_supervisors instead

---

## Performance Considerations

### Indexes to Maintain
```sql
-- Critical indexes for booking flow
CREATE INDEX IF NOT EXISTS idx_teori_sessions_date ON teori_sessions(date);
CREATE INDEX IF NOT EXISTS idx_teori_sessions_lesson_type_id ON teori_sessions(lesson_type_id);
CREATE INDEX IF NOT EXISTS idx_teori_bookings_session_id ON teori_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_teori_bookings_student_id ON teori_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
```

### Query Optimization
- Always use `eq()`, `and()`, `or()` from drizzle-orm for type safety
- Use `count()` for counting related records
- Use `sql` template for complex expressions
- Always include `isActive = true` filters where applicable
- Use `limit()` for pagination
- Use `orderBy()` for consistent sorting

---

## Common Pitfalls to Avoid

1. **Don't mix legacy and new tables** - Use teori_* tables for all theoretical sessions
2. **Always validate required fields** - Check schema requirements before inserts
3. **Handle foreign key constraints** - Ensure referenced records exist
4. **Use transactions for multi-table operations** - Especially for bookings with supervisors
5. **Don't forget cascade deletes** - Understand relationship implications
6. **Always include error handling** - Database operations can fail
7. **Use proper TypeScript types** - Import from schema for type safety
8. **Check capacity before booking** - Validate session availability
9. **Update participant counts** - Keep currentParticipants in sync
10. **Use consistent date/time formats** - Follow schema column types
