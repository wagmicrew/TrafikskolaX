# Project Structure & Dependencies

## Overview
This document provides a comprehensive guide to the project's file structure, key components, and their relationships, designed to help AI systems understand the codebase architecture.

## Core Directories

### 1. `/app` - Next.js App Router
- **Purpose**: Main application routes and pages using Next.js 13+ App Router
- **Key Subdirectories**:
  - `/api` - API route handlers
  - `/dashboard` - Admin and user dashboard pages
  - `/booking` - Booking-related pages
  - `/inloggning` - Authentication pages

### 2. `/components` - Reusable UI Components
- **Purpose**: Shared React components
- **Key Subdirectories**:
  - `/Admin` - Admin-specific components
  - `/booking` - Booking-related components
  - `/ui` - Base UI components (buttons, inputs, etc.)

### 3. `/lib` - Core Application Logic
- **Purpose**: Contains business logic, utilities, and services
- **Key Subdirectories**:
  - `/auth` - Authentication logic
  - `/db` - Database models and queries
  - `/email` - Email services and templates
  - `/payment` - Payment processing
  - `/utils` - Utility functions

## Key Files and Dependencies

### Database & Data Layer
- `lib/db/schema.ts` - Database schema definitions using Drizzle ORM
- `lib/db/index.ts` - Database client initialization
- `lib/db/client.ts` - Database connection configuration

### Authentication
- `lib/auth/server-auth.ts` - Server-side authentication
- `lib/auth/jwt.ts` - JWT token handling
- `app/api/auth/[...nextauth]/route.ts` - Auth API routes

### Email System
- `lib/email/email-service.ts` - Core email service
- `lib/email/enhanced-email-service.ts` - Extended email functionality
- `lib/email/email-cron-service.ts` - Scheduled email jobs

### Payment Processing
- `lib/payment/qliro-service.ts` - Qliro payment integration
- `lib/payment/swish-service.ts` - Swish payment integration
- `app/api/payments/` - Payment API endpoints

## Data Flow

### Booking Flow
1. User interacts with `/app/booking` pages
2. Components in `/components/booking` handle UI
3. API routes in `/app/api/bookings` process requests
4. Database operations through `lib/db`
5. Email notifications via `lib/email`

### Authentication Flow
1. User visits `/inloggning`
2. Auth API routes handle login/register
3. JWT tokens issued and validated
4. Protected routes check auth status

## Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...

# Email
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...

# Payments
SWISH_MERCHANT_NUMBER=...
QLIRO_MERCHANT_ID=...
```

## Development Setup
1. Install dependencies: `npm install`
2. Set up environment variables
3. Run migrations: `npm run db:migrate`
4. Start dev server: `npm run dev`

## Testing
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Test coverage: `npm run test:coverage`

## Deployment
- Production: `npm run build && npm start`
- Staging: `npm run build:staging`

## Dependencies
- Next.js 13+
- React 18+
- TypeScript
- Drizzle ORM
- Tailwind CSS
- Shadcn/ui components
- NextAuth.js
- Qliro & Swish SDKs
