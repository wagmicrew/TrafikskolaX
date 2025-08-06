# Database Structure Documentation

## Overview
This application uses **Neon PostgreSQL** database with **Drizzle ORM** for all database operations. The database is structured for a driving school management system with user management, booking system, payment processing, and email automation.

## Core Tables

### Users Table (`users`)
**Primary table for all user types (students, teachers, admins)**

| Column | Type | Description | Usage |
|--------|------|-------------|-------|
| `id` | UUID | Primary key | User identification |
| `email` | VARCHAR(255) | Unique email | Login credential |
| `firstName` | VARCHAR(255) | User's first name | Display and emails |
| `lastName` | VARCHAR(255) | User's last name | Display and emails |
| `password` | VARCHAR(255) | Hashed password | Authentication |
| `role` | VARCHAR(50) | User role | Authorization (student/teacher/admin) |
| `phone` | VARCHAR(50) | Phone number | Contact information |
| `address` | TEXT | Full address | Contact information |
| `customerNumber` | VARCHAR(50) | Unique customer ID | Business identification |
| `inskriven` | BOOLEAN | Enrolled student status | Special pricing |
| `customPrice` | DECIMAL(10,2) | Custom lesson price | Special pricing |
| `inskrivenDate` | TIMESTAMP | Enrollment date | Tracking |
| `createdAt` | TIMESTAMP | Account creation | Audit trail |
| `updatedAt` | TIMESTAMP | Last update | Audit trail |

**Usage in Code:**
- Authentication: `lib/auth/`
- User management: `app/dashboard/admin/users/`
- Profile updates: `app/api/user/profile/`

### Bookings Table (`bookings`)
**Core booking system for driving lessons**

| Column | Type | Description | Usage |
|--------|------|-------------|-------|
| `id` | UUID | Primary key | Booking identification |
| `userId` | UUID | Student reference | User relationship |
| `teacherId` | UUID | Teacher reference | Teacher assignment |
| `lessonTypeId` | UUID | Lesson type reference | Lesson configuration |
| `scheduledDate` | DATE | Lesson date | Scheduling |
| `startTime` | TIME | Start time | Scheduling |
| `endTime` | TIME | End time | Scheduling |
| `status` | VARCHAR(50) | Booking status | Workflow management |
| `paymentStatus` | VARCHAR(50) | Payment status | Payment tracking |
| `totalPrice` | DECIMAL(10,2) | Lesson price | Financial tracking |
| `swishUUID` | VARCHAR(255) | Swish payment ID | Payment processing |
| `qliroPaymentReference` | VARCHAR(255) | Qliro payment ID | Payment processing |
| `createdAt` | TIMESTAMP | Booking creation | Audit trail |
| `updatedAt` | TIMESTAMP | Last update | Audit trail |

**Usage in Code:**
- Booking management: `app/api/booking/`
- Admin dashboard: `app/dashboard/admin/bookings/`
- Student dashboard: `app/dashboard/student/`

### Lesson Types Table (`lesson_types`)
**Configurable lesson types with pricing**

| Column | Type | Description | Usage |
|--------|------|-------------|-------|
| `id` | UUID | Primary key | Lesson type identification |
| `name` | VARCHAR(255) | Lesson name | Display |
| `description` | TEXT | Lesson description | Information |
| `durationMinutes` | INTEGER | Lesson duration | Scheduling |
| `price` | DECIMAL(10,2) | Standard price | Pricing |
| `priceStudent` | DECIMAL(10,2) | Student price | Special pricing |
| `salePrice` | DECIMAL(10,2) | Sale price | Promotions |
| `isActive` | BOOLEAN | Availability | Configuration |
| `createdAt` | TIMESTAMP | Creation date | Audit trail |
| `updatedAt` | TIMESTAMP | Last update | Audit trail |

**Usage in Code:**
- Admin management: `app/dashboard/admin/lessons/`
- Booking system: `app/api/booking/`
- Package system: `app/api/packages/`

### Site Settings Table (`site_settings`)
**Application configuration and settings**

| Column | Type | Description | Usage |
|--------|------|-------------|-------|
| `id` | UUID | Primary key | Setting identification |
| `key` | VARCHAR(255) | Setting key | Configuration lookup |
| `value` | TEXT | Setting value | Configuration data |
| `description` | TEXT | Setting description | Documentation |
| `category` | VARCHAR(100) | Setting category | Organization |
| `isEnv` | BOOLEAN | Environment variable flag | Security |
| `createdAt` | TIMESTAMP | Creation date | Audit trail |
| `updatedAt` | TIMESTAMP | Last update | Audit trail |

**Key Settings:**
- `schoolname`: School name for emails and display
- `from_name`: Email sender name
- `from_email`: Email sender address
- `swish_number`: Swish payment number
- `qliro_api_key`: Qliro payment API key
- `use_sendgrid`: Email service configuration

**Usage in Code:**
- Settings management: `app/api/admin/settings/`
- Email configuration: `lib/email/`
- Payment configuration: `lib/payment/`

## Relationships

### User Relationships
- **Users → Bookings**: One-to-many (student can have multiple bookings)
- **Users → Bookings**: One-to-many (teacher can have multiple bookings)
- **Users → HandledarSessions**: One-to-many (teacher can have multiple sessions)

### Booking Relationships
- **Bookings → Users**: Many-to-one (student and teacher)
- **Bookings → LessonTypes**: Many-to-one (lesson type)
- **Bookings → Packages**: Many-to-one (if part of package)

### Email System Relationships
- **EmailTemplates → EmailReceivers**: One-to-many (template can have multiple receivers)
- **EmailTemplates → EmailTriggers**: One-to-one (template has one trigger)

## Database Operations

### Using Drizzle ORM
```typescript
// Import schema
import { db } from '@/lib/db';
import { users, bookings, siteSettings } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// Query examples
const user = await db.select().from(users).where(eq(users.id, userId));
const settings = await db.select().from(siteSettings).where(eq(siteSettings.key, 'schoolname'));
const bookings = await db.select().from(bookings).where(eq(bookings.userId, userId));
```

### Common Patterns
1. **Authentication**: Check user credentials in `users` table
2. **Authorization**: Use `role` field for access control
3. **Configuration**: Fetch settings from `site_settings` table
4. **Audit Trail**: Use `createdAt` and `updatedAt` timestamps

## Security Considerations
- All passwords are hashed using bcrypt
- Sensitive settings marked with `isEnv: true`
- User roles control access to different parts of the application
- Payment data stored with proper encryption

## Migration Strategy
- Use Drizzle migrations in `drizzle/` directory
- Database changes tracked in version control
- Rollback capability for all migrations
- Test migrations in development before production 