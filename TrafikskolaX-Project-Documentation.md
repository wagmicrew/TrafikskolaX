# TrafikskolaX Project Documentation

**Version:** 1.0.0  
**Date:** December 2024  
**Project:** Din Trafikskola Hässleholm Management System  

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema](#database-schema)
4. [Authentication System](#authentication-system)
5. [Booking System](#booking-system)
6. [Payment Processing](#payment-processing)
7. [Email Notification System](#email-notification-system)
8. [User Interface & Components](#user-interface--components)
9. [Development Setup](#development-setup)
10. [API Reference](#api-reference)
11. [Deployment Guide](#deployment-guide)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**TrafikskolaX** is a comprehensive driving school management system designed for "Din Trafikskola Hässleholm". The system handles lesson bookings, user management, payment processing, and automated notifications for a Swedish driving school.

### Key Features

- **Multi-role User System**: Students, Teachers, and Administrators
- **Real-time Booking System**: Lesson scheduling with availability checking
- **Payment Integration**: Swish (mobile payments) and Qliro (installments)
- **Email Automation**: Template-based notifications and reminders
- **Progress Tracking**: Swedish driving education curriculum integration
- **Internal Messaging**: Communication between users
- **Package Management**: Credit-based lesson packages

### Business Context

The system serves a Swedish driving school offering:
- **B-körkort**: Standard car license training
- **A-körkort**: Motorcycle license training
- **Taxiförarlegitimation**: Taxi driver license
- **Handledarutbildning**: Instructor training programs
- **Bedömningslektion**: Assessment lessons

---

## Architecture & Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.2.4 | React framework with App Router |
| React | 19 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3.4.17 | Utility-first CSS framework |
| Radix UI | Latest | Accessible UI primitives |
| shadcn/ui | Latest | Pre-built component library |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | Latest LTS | Runtime environment |
| PostgreSQL | Latest | Primary database (Neon) |
| Drizzle ORM | 0.44.3 | Database query builder |
| JWT | 9.0.2 | Authentication tokens |
| bcryptjs | 3.0.2 | Password hashing |
| SendGrid | 8.1.5 | Email delivery |

### Development Tools

| Tool | Purpose |
|------|---------|
| Drizzle Kit | Database migrations and schema management |
| ESLint | Code linting |
| TypeScript | Type checking |
| Tailwind CSS | Styling |
| React Hook Form | Form handling |
| Zod | Schema validation |

---

## Database Schema

### Core Tables

#### Users Table (`users`)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  personal_number VARCHAR(12) UNIQUE,
  role user_role DEFAULT 'student',
  customer_number VARCHAR(20) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  -- Utbildningskort fields
  workplace VARCHAR(255),
  work_phone VARCHAR(50),
  mobile_phone VARCHAR(50),
  kk_validity_date DATE,
  risk_education_1 DATE,
  risk_education_2 DATE,
  knowledge_test DATE,
  driving_test DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Bookings Table (`bookings`)
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  lesson_type_id UUID NOT NULL REFERENCES lesson_types(id),
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  transmission_type VARCHAR(20),
  teacher_id UUID REFERENCES users(id),
  car_id UUID REFERENCES cars(id),
  status VARCHAR(50) DEFAULT 'temp',
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  payment_method VARCHAR(50),
  total_price DECIMAL(10,2) NOT NULL,
  -- Guest booking fields
  is_guest_booking BOOLEAN DEFAULT false,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(50),
  -- Completion fields
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  feedback_ready BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Lesson Types Table (`lesson_types`)
```sql
CREATE TABLE lesson_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  price DECIMAL(10,2) NOT NULL,
  price_student DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### User Credits Table (`user_credits`)
```sql
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_type_id UUID REFERENCES lesson_types(id),
  handledar_session_id UUID REFERENCES handledar_sessions(id),
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_total INTEGER NOT NULL DEFAULT 0,
  package_id UUID REFERENCES packages(id),
  credit_type VARCHAR(50) NOT NULL DEFAULT 'lesson',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Additional Tables

- **`cars`**: Vehicle inventory management
- **`handledar_sessions`**: Instructor training sessions
- **`handledar_bookings`**: Session bookings
- **`internal_messages`**: User communication system
- **`user_feedback`**: Lesson feedback and ratings
- **`booking_steps`**: Swedish driving curriculum
- **`packages`**: Lesson package definitions
- **`package_contents`**: Package item definitions
- **`site_settings`**: System configuration
- **`blocked_slots`**: Unavailable time slots
- **`slot_settings`**: Default availability settings

---

## Authentication System

### User Roles

#### Student Role
- Book lessons and packages
- View personal schedule
- Submit lesson feedback
- Access learning materials
- Manage profile information

#### Teacher Role
- View assigned lessons
- Submit student feedback
- Set availability schedule
- Access teaching materials
- Manage student progress

#### Admin Role
- Full system access
- User management
- System configuration
- Booking management
- Payment reconciliation
- Email template management

### Security Implementation

#### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  firstName: string;
  lastName: string;
  iat: number;  // issued at
  exp: number   // expiration time
}
```

#### Password Security
- bcrypt hashing with 10 salt rounds
- Minimum 8 characters required
- Complexity requirements enforced
- Rate limiting on login attempts

#### Session Management
- HTTP-only cookies for token storage
- 7-day token expiration
- Secure flag for HTTPS environments
- SameSite=Strict cookie policy

### Authentication Flow

1. **Registration**
   - User submits registration form
   - Server validates input data
   - Password hashed with bcrypt
   - User created in database
   - Welcome email sent
   - Success response returned

2. **Login**
   - User submits credentials
   - Server verifies email/password
   - JWT token generated
   - Token stored in HTTP-only cookie
   - Redirect to appropriate dashboard

3. **Protected Routes**
   - Client includes token in requests
   - Server verifies token validity
   - Role-based access control applied
   - Access granted/denied accordingly

---

## Booking System

### Booking States

| State | Description | Next Possible States |
|-------|-------------|---------------------|
| `temp` | Temporary booking (15-min hold) | `on_hold`, `cancelled` |
| `on_hold` | Payment pending | `confirmed`, `cancelled` |
| `confirmed` | Booking confirmed | `completed`, `cancelled` |
| `completed` | Lesson completed | - |
| `cancelled` | Booking cancelled | - |

### Booking Flow

#### 1. Availability Check
```typescript
// Check teacher and car availability
const availableSlots = await checkAvailability({
  date: '2024-12-15',
  lessonTypeId: 'uuid',
  teacherId: 'uuid' // optional
});
```

#### 2. Temporary Booking
```typescript
// Create temporary booking
const booking = await createTemporaryBooking({
  lessonTypeId: 'uuid',
  scheduledDate: '2024-12-15',
  startTime: '09:00',
  endTime: '10:00',
  teacherId: 'uuid',
  carId: 'uuid'
});
```

#### 3. Payment Processing
```typescript
// Process payment based on method
const payment = await processPayment({
  bookingId: 'uuid',
  method: 'swish' | 'qliro' | 'credits' | 'invoice',
  amount: 500.00
});
```

#### 4. Confirmation
```typescript
// Confirm booking and send notifications
await confirmBooking(bookingId);
await sendBookingConfirmation(bookingId);
await notifyTeacher(bookingId);
```

### API Endpoints

#### Get Availability
```
GET /api/booking/available-slots
Params: date, lessonTypeId, teacherId?
Response: Array of available time slots
```

#### Create Booking
```
POST /api/booking/create
Body: {
  sessionType: 'lesson' | 'handledar',
  sessionId: string,
  scheduledDate: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  totalPrice: number,
  paymentMethod: string,
  guestName?: string,
  guestEmail?: string,
  guestPhone?: string
}
```

#### Update Booking
```
PATCH /api/bookings/[id]
Body: {
  status?: 'cancelled' | 'completed',
  paymentStatus?: 'paid' | 'failed' | 'refunded'
}
```

---

## Payment Processing

### Payment Methods

#### Swish (Mobile Payments)
- Swedish mobile payment system
- QR code generation for payments
- Real-time payment confirmation
- Automatic booking confirmation on success

#### Qliro (Installment Payments)
- Buy now, pay later service
- Multiple installment options
- Credit check integration
- Automatic recurring payments

#### Credits System
- Package-based lesson credits
- Pre-purchased lesson packages
- Automatic credit deduction
- Credit expiration management

#### Invoice Payments
- Manual payment processing
- PDF invoice generation
- Payment tracking
- Reminder system

### Payment States

| State | Description |
|-------|-------------|
| `pending` | Payment initiated |
| `processing` | Payment being processed |
| `completed` | Payment successful |
| `failed` | Payment failed |
| `refunded` | Payment refunded |
| `partially_refunded` | Partial refund issued |

### Payment Flow

1. **Initiation**
   - User selects payment method
   - System creates payment intent
   - Payment provider returns payment URL/token
   - User redirected to payment page

2. **Processing**
   - User completes payment on provider page
   - Provider sends webhook on completion
   - System verifies payment
   - Booking status updated

3. **Completion**
   - Booking marked as confirmed
   - Invoice generated (if applicable)
   - User credits updated (for packages)
   - Confirmation email sent

### Security Measures

- **PCI Compliance**: No sensitive data storage
- **Token-based Payments**: Secure payment tokens
- **Webhook Verification**: Payment confirmation validation
- **Encryption**: All payment data encrypted
- **Audit Logging**: Complete payment history tracking

---

## Email Notification System

### System Architecture

#### Core Components
- **EmailService**: Main email delivery service
- **EnhancedEmailService**: Advanced functionality with fallbacks
- **TemplateService**: Template rendering and management
- **NotificationService**: Trigger-based email sending

#### Email Triggers

| Trigger | Template | Recipient | Description |
|---------|----------|-----------|-------------|
| User Registration | `welcome_email` | New User | Sent after registration |
| Booking Confirmation | `booking_confirmation` | Student | Payment received |
| 24h Reminder | `booking_reminder` | Student | 24h before lesson |
| Teacher Assignment | `teacher_assignment` | Teacher | When assigned to lesson |
| Payment Receipt | `payment_receipt` | Payer | After successful payment |
| Password Reset | `password_reset` | User | Password reset requested |
| Feedback Request | `feedback_request` | Student | After lesson completion |

### Template System

#### Template Variables
```html
<!-- Available variables -->
{{user.firstName}} - User's first name
{{user.lastName}} - User's last name
{{user.email}} - User's email address
{{booking.id}} - Booking reference number
{{booking.date}} - Formatted booking date
{{lesson.type}} - Type of lesson
{{lesson.duration}} - Duration in minutes
{{payment.amount}} - Payment amount
{{payment.method}} - Payment method used
```

#### Example Template
```html
<div>
  <h2>Hej {{user.firstName}}!</h2>
  <p>Tack för din bokning hos oss.</p>
  <p><strong>Detaljer:</strong></p>
  <ul>
    <li>Typ: {{lesson.type}}</li>
    <li>Datum: {{booking.date}}</li>
    <li>Tid: {{booking.time}}</li>
    <li>Pris: {{payment.amount}} kr</li>
  </ul>
</div>
```

### Configuration

#### SMTP Settings
```env
SMTP_HOST=mailcluster.loopia.se
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@dintrafikskolahlm.se
SMTP_PASS=your_password_here
FROM_EMAIL=info@dintrafikskolahlm.se
FROM_NAME="Din Trafikskola HLM"
```

#### SendGrid (Alternative)
```env
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM=info@dintrafikskolahlm.se
SENDGRID_FROM_NAME="Din Trafikskola HLM"
```

### Error Handling

#### Fallback Mechanisms
1. **Primary Method**: Tries configured primary email method
2. **Fallback Method**: If primary fails, tries alternative method
3. **Database Storage**: If all else fails, stores email for manual sending

#### Monitoring
- All email operations logged with timestamps
- Delivery status tracking
- Error details captured
- Retry mechanisms implemented

---

## User Interface & Components

### Component Architecture

#### Base UI Components (`components/ui/`)
```typescript
// Shadcn/ui components
- Button, Input, Select, Dialog
- Card, Table, Form, Modal
- Dropdown, Tabs, Accordion
- Toast, Alert, Badge
```

#### Feature Components
```typescript
// Booking components
- BookingSteps, BookingConfirmation
- AvailableSlots, BookingCalendar
- PaymentMethods, SwishQR

// Admin components
- AdminDashboard, UserManagement
- BookingManagement, EmailTemplates
- SettingsPanel, DebugTools

// User components
- UserDashboard, ProfileSettings
- MessageCenter, FeedbackForm
```

### Design System

#### Color Palette
```css
/* Primary colors */
--primary: hsl(220, 13%, 18%);
--primary-foreground: hsl(210, 40%, 98%);

/* Secondary colors */
--secondary: hsl(210, 40%, 96%);
--secondary-foreground: hsl(222.2, 84%, 4.9%);

/* Accent colors */
--accent: hsl(210, 40%, 96%);
--accent-foreground: hsl(222.2, 84%, 4.9%);

/* Status colors */
--destructive: hsl(0, 84.2%, 60.2%);
--success: hsl(142, 76%, 36%);
--warning: hsl(38, 92%, 50%);
```

#### Typography
- **Primary Font**: Inter (sans-serif)
- **Display Font**: Playfair Display (serif)
- **Monospace**: JetBrains Mono (code)

#### Spacing System
```css
/* Tailwind spacing scale */
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
```

### Responsive Design

#### Breakpoints
```css
/* Mobile first approach */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

#### Layout Patterns
- **Mobile**: Single column, stacked elements
- **Tablet**: Two-column layout, side navigation
- **Desktop**: Multi-column, complex layouts

---

## Development Setup

### Prerequisites

#### Required Software
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **PostgreSQL**: 14.x or higher (or Neon account)

#### Development Tools
- **VS Code**: Recommended IDE
- **Postman**: API testing
- **DBeaver**: Database management
- **Chrome DevTools**: Frontend debugging

### Installation Steps

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/trafikskolax.git
cd trafikskolax
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

#### 4. Database Setup
```bash
# Run database migrations
npm run db:migrate

# Setup initial data
npm run db:setup

# Start database browser
npm run db:studio
```

#### 5. Start Development Server
```bash
npm run dev
```

### Environment Variables

#### Required Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Authentication
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Email
SMTP_HOST=mailcluster.loopia.se
SMTP_PORT=587
SMTP_USER=admin@dintrafikskolahlm.se
SMTP_PASS=your-smtp-password
SENDGRID_API_KEY=your-sendgrid-key

# Payments
SWISH_MERCHANT_NUMBER=your-swish-number
QLIRO_MERCHANT_ID=your-qliro-id
QLIRO_API_KEY=your-qliro-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Optional Variables
```env
# Development
NODE_ENV=development
DEBUG=true

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# External Services
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
FACEBOOK_PIXEL_ID=FB_PIXEL_ID
```

### Available Scripts

#### Development Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript check
```

#### Database Scripts
```bash
npm run db:generate      # Generate migration
npm run db:migrate       # Apply migrations
npm run db:studio        # Open database browser
npm run db:setup         # Setup initial data
npm run db:seed          # Seed test data
```

#### Utility Scripts
```bash
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run analyze          # Bundle analysis
```

---

## API Reference

### Authentication Endpoints

#### POST /api/auth/login
```typescript
// Request
{
  email: string;
  password: string;
}

// Response
{
  success: boolean;
  token: string;
  redirectUrl: string;
  user: {
    userId: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}
```

#### POST /api/auth/register
```typescript
// Request
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  personalNumber?: string;
}

// Response
{
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
```

### Booking Endpoints

#### GET /api/booking/available-slots
```typescript
// Request
{
  date: string;          // YYYY-MM-DD
  lessonTypeId: string;
  teacherId?: string;
}

// Response
{
  slots: Array<{
    startTime: string;   // HH:MM
    endTime: string;     // HH:MM
    teacherId: string;
    carId: string;
    isAvailable: boolean;
  }>;
}
```

#### POST /api/booking/create
```typescript
// Request
{
  sessionType: 'lesson' | 'handledar';
  sessionId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPrice: number;
  paymentMethod: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

// Response
{
  success: boolean;
  bookingId: string;
  paymentUrl?: string;
  message: string;
}
```

### User Management Endpoints

#### GET /api/users/me
```typescript
// Response
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    isActive: boolean;
  };
}
```

#### PUT /api/users/me
```typescript
// Request
{
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
}

// Response
{
  success: boolean;
  message: string;
}
```

### Admin Endpoints

#### GET /api/admin/bookings
```typescript
// Request
{
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Response
{
  bookings: Array<Booking>;
  total: number;
  page: number;
  totalPages: number;
}
```

#### POST /api/admin/email-templates
```typescript
// Request
{
  name: string;
  subject: string;
  htmlContent: string;
  triggerType: string;
  receivers: string[];
}

// Response
{
  success: boolean;
  templateId: string;
  message: string;
}
```

---

## Deployment Guide

### Production Environment

#### Server Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB+ minimum
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ or similar
- **Node.js**: 18.x LTS
- **PostgreSQL**: 14.x+

#### Environment Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2
```

#### Application Deployment
```bash
# Clone repository
git clone https://github.com/your-org/trafikskolax.git
cd trafikskolax

# Install dependencies
npm install

# Build application
npm run build

# Setup environment
cp .env.example .env
nano .env

# Run migrations
npm run db:migrate

# Start with PM2
pm2 start npm --name "trafikskolax" -- start
pm2 save
pm2 startup
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Monitoring & Maintenance

#### Log Management
```bash
# View application logs
pm2 logs trafikskolax

# View error logs
pm2 logs trafikskolax --err

# Monitor resources
pm2 monit
```

#### Database Backups
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
gzip backup_$DATE.sql

# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

#### Performance Monitoring
- **PM2**: Process monitoring
- **New Relic**: Application performance
- **Sentry**: Error tracking
- **Google Analytics**: User analytics

---

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connection
npm run db:check

# Verify environment variables
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT version();"
```

#### Email Delivery Problems
```bash
# Test email configuration
npm run test:email

# Check email logs
tail -f logs/email-*.log

# Verify SMTP settings
telnet $SMTP_HOST $SMTP_PORT
```

#### Payment Integration Issues
```bash
# Test Swish integration
curl -X POST http://localhost:3000/api/payments/swish/test

# Test Qliro integration
curl -X POST http://localhost:3000/api/payments/qliro/test

# Check payment logs
tail -f logs/payment-*.log
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install

# Check TypeScript errors
npm run type-check

# Check ESLint errors
npm run lint
```

### Debug Tools

#### Admin Debug Dashboard
- **URL**: `/dashboard/admin/logging`
- **Features**: 
  - View system logs
  - Test email templates
  - Check database status
  - Monitor payment flows

#### Database Browser
```bash
# Start Drizzle Studio
npm run db:studio

# Access at: http://localhost:4983
```

#### API Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test booking creation
curl -X POST http://localhost:3000/api/booking/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sessionType":"lesson","sessionId":"uuid",...}'
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM bookings WHERE user_id = 'uuid';
```

#### Frontend Optimization
```bash
# Analyze bundle size
npm run analyze

# Optimize images
npm run optimize-images

# Enable compression
npm run build:compressed
```

#### Caching Strategies
```typescript
// Implement Redis caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache frequently accessed data
const cachedData = await redis.get('key');
if (!cachedData) {
  const data = await fetchData();
  await redis.setex('key', 3600, JSON.stringify(data));
}
```

---

## Conclusion

This documentation provides a comprehensive overview of the TrafikskolaX project, covering all aspects from architecture and setup to deployment and troubleshooting. The system is designed to be scalable, maintainable, and user-friendly while meeting the specific needs of a Swedish driving school.

For additional support or questions, please refer to the project's GitHub repository or contact the development team.

---

**Document Version:** 1.0.0  
**Last Updated:** December 2024  
**Maintained By:** Development Team  
**Contact:** dev@dintrafikskolahlm.se 