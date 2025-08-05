# Database Documentation

## Connection Details
- **Type**: PostgreSQL (Neon)
- **Connection String**: `postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **ORM**: Drizzle ORM

## Schema Reference

### 1. Users (`users`)
**Purpose**: Stores all user accounts (students, teachers, admins)

**Columns**:
- `id` (uuid, PK): Unique user identifier
- `email` (varchar): User's email (unique)
- `password` (varchar): Hashed password
- `firstName`, `lastName` (varchar): User's name
- `role` (enum): 'student', 'teacher', or 'admin'
- `personalNumber` (varchar): Swedish personnummer
- `customerNumber` (varchar): Internal customer reference
- `isActive` (boolean): Account status
- `inskriven` (boolean): Registration status
- `customPrice` (decimal): Custom pricing if applicable
- `createdAt`, `updatedAt` (timestamp): Audit fields

### 2. Bookings (`bookings`)
**Purpose**: Tracks all lesson bookings

**Columns**:
- `id` (uuid, PK): Unique booking identifier
- `userId` (uuid, FK): Reference to users table
- `lessonTypeId` (uuid, FK): Type of lesson
- `scheduledDate` (date): Booking date
- `startTime`, `endTime` (time): Booking time slot
- `status` (varchar): 'temp', 'on_hold', 'confirmed', 'cancelled'
- `paymentStatus` (varchar): 'unpaid', 'paid', etc.
- `totalPrice` (decimal): Booking cost
- `isCompleted` (boolean): Lesson completion status
- `teacherId` (uuid, FK): Assigned teacher
- `carId` (uuid, FK): Assigned vehicle

### 3. Lesson Types (`lesson_types`)
**Purpose**: Defines available lesson types and pricing

**Columns**:
- `id` (uuid, PK)
- `name` (varchar): e.g., "B-körkort"
- `description` (text)
- `durationMinutes` (integer)
- `price` (decimal)
- `priceStudent` (decimal): Discounted price for students
- `isActive` (boolean)

### 4. User Credits (`user_credits`)
**Purpose**: Tracks lesson credits/packages

**Columns**:
- `id` (uuid, PK)
- `userId` (uuid, FK)
- `lessonTypeId` (uuid, FK)
- `creditsRemaining` (integer)
- `creditsTotal` (integer)
- `packageId` (uuid, FK): If from a package
- `creditType` (varchar): 'lesson' or 'handledar'

## Best Practices

1. **Connection Management**:
   - Always use the connection pool
   - Close connections after use
   - Use environment variables for credentials

2. **Query Optimization**:
   - Use parameterized queries
   - Select only needed columns
   - Use transactions for multiple operations
   - Implement proper error handling

3. **Schema Changes**:
   - Use migrations for all changes
   - Test migrations in development first
   - Back up before production changes

4. **Performance**:
   - Index frequently queried columns
   - Monitor slow queries
   - Use `EXPLAIN ANALYZE` for optimization
