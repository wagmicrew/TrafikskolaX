# File Dependencies & Relationships

## Core Services

### 1. Database Layer
- **`lib/db/schema.ts`**
  - Defines all database tables and relations
  - Used by: All services that interact with the database
  - Dependencies: `drizzle-orm`, `pg`

- **`lib/db/index.ts`**
  - Initializes Drizzle ORM with Neon database
  - Exports `db` instance for database operations
  - Dependencies: `@neondatabase/serverless`, `drizzle-orm`

### 2. Authentication
- **`lib/auth/server-auth.ts`**
  - Handles server-side authentication
  - Uses: `lib/auth/jwt.ts`
  - Used by: API routes, middleware

- **`middleware.ts`**
  - Protects routes based on auth status
  - Uses: `lib/auth/server-auth.ts`
  - Protects: All routes under `/dashboard`

### 3. Email System
- **`lib/email/email-service.ts`**
  - Core email sending functionality
  - Uses: `lib/db` (for templates), `lib/mailer`
  - Used by: Booking system, user management

- **`lib/email/enhanced-email-service.ts`**
  - Extends base email service with additional features
  - Inherits: `email-service.ts`
  - Adds: Template processing, error handling

## API Routes

### 1. Authentication
- **`app/api/auth/[...nextauth]/route.ts`**
  - Handles login/register requests
  - Uses: NextAuth.js, `lib/auth`
  - Returns: JWT tokens

### 2. Bookings
- **`app/api/bookings/route.ts`**
  - CRUD operations for bookings
  - Uses: `lib/db`, `lib/email`
  - Validates: User permissions, availability

### 3. Payments
- **`app/api/payments/swish/route.ts`**
  - Handles Swish payments
  - Uses: `lib/payment/swish-service.ts`
  - Calls: Swish API

- **`app/api/payments/qliro/route.ts`**
  - Handles Qliro payments
  - Uses: `lib/payment/qliro-service.ts`
  - Processes: Installment payments

## Frontend Components

### 1. Booking Flow
- **`components/booking/BookingForm.tsx`**
  - Handles booking creation
  - Uses: `lib/api/bookings.ts`
  - Updates: Booking calendar

- **`components/booking/Calendar.tsx`**
  - Displays available time slots
  - Uses: `lib/api/availability.ts`
  - Updates: Booking form

### 2. Dashboard
- **`components/dashboard/UserBookings.tsx`**
  - Shows user's upcoming lessons
  - Uses: `lib/api/bookings.ts`
  - Fetches: User-specific data

## Data Flow Examples

### Creating a Booking
1. User submits `BookingForm`
2. Form calls `POST /api/bookings`
3. API validates and creates booking
4. Email confirmation sent via `EmailService`
5. UI updates with success/error

### Processing Payment
1. User selects payment method
2. Frontend calls payment API
3. Server processes payment
4. Booking status updated
5. Confirmation email sent

## Testing Dependencies
- **`__tests__/`**
  - Unit tests for components
  - Integration tests for API routes
  - Uses: Jest, React Testing Library

## Configuration Files
- **`next.config.js`** - Next.js configuration
- **`tailwind.config.js`** - Tailwind CSS setup
- **`tsconfig.json`** - TypeScript configuration
- **`package.json`** - Project dependencies

## Environment Variables
Documented in `.env.example`:
```
# Required for all environments
DATABASE_URL=
JWT_SECRET=
NEXTAUTH_SECRET=

# Email configuration
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Payment providers
SWISH_MERCHANT_NUMBER=
QLIRO_MERCHANT_ID=
```
