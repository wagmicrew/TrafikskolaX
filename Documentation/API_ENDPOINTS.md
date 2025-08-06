# API Endpoints Documentation

## Overview
This application uses Next.js API routes with TypeScript. All endpoints are RESTful and follow consistent patterns for authentication, error handling, and response formatting.

## Authentication Endpoints

### POST `/api/auth/login`
**User login endpoint**

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  token?: string;
  error?: string;
}
```

**Usage:** User authentication and session creation

### POST `/api/auth/register`
**User registration endpoint**

**Request Body:**
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  user?: User;
  error?: string;
}
```

**Usage:** New user account creation

### POST `/api/auth/verify`
**Token verification endpoint**

**Headers:**
```typescript
{
  Authorization: "Bearer <token>";
}
```

**Response:**
```typescript
{
  success: boolean;
  user?: User;
  error?: string;
}
```

**Usage:** Verify JWT token and get user data

## Booking System Endpoints

### GET `/api/booking/available-slots`
**Get available booking slots**

**Query Parameters:**
```typescript
{
  date: string; // YYYY-MM-DD
  lessonTypeId?: string;
}
```

**Response:**
```typescript
{
  slots: Array<{
    id: string;
    startTime: string;
    endTime: string;
    teacherId: string;
    teacherName: string;
  }>;
}
```

**Usage:** Display available time slots for booking

### POST `/api/booking/create`
**Create new booking**

**Request Body:**
```typescript
{
  lessonTypeId: string;
  teacherId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  booking?: Booking;
  error?: string;
}
```

**Usage:** Create new driving lesson booking

### PUT `/api/booking/confirm`
**Confirm booking payment**

**Request Body:**
```typescript
{
  bookingId: string;
  paymentMethod: 'swish' | 'qliro' | 'credits';
}
```

**Response:**
```typescript
{
  success: boolean;
  paymentUrl?: string; // For Qliro
  swishQR?: string; // For Swish
  error?: string;
}
```

**Usage:** Process booking payment

## Admin Endpoints

### GET `/api/admin/bookings`
**Get all bookings for admin**

**Query Parameters:**
```typescript
{
  status?: string;
  date?: string;
  teacherId?: string;
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
{
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
}
```

**Usage:** Admin booking management dashboard

### PUT `/api/admin/bookings/[id]`
**Update booking status**

**Request Body:**
```typescript
{
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  booking?: Booking;
  error?: string;
}
```

**Usage:** Admin booking status updates

### GET `/api/admin/users`
**Get all users for admin**

**Query Parameters:**
```typescript
{
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
{
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}
```

**Usage:** Admin user management

## Settings Endpoints

### GET `/api/admin/settings`
**Get application settings**

**Response:**
```typescript
{
  settings: {
    schoolname: string;
    from_name: string;
    from_email: string;
    swish_number: string;
    swish_enabled: boolean;
    qliro_api_key: string;
    qliro_enabled: boolean;
    // ... other settings
  };
}
```

**Usage:** Admin settings management

### PUT `/api/admin/settings`
**Update application settings**

**Request Body:**
```typescript
{
  schoolname?: string;
  from_name?: string;
  from_email?: string;
  swish_number?: string;
  swish_enabled?: boolean;
  // ... other settings
}
```

**Response:**
```typescript
{
  message: string;
}
```

**Usage:** Update application configuration

## Email System Endpoints

### GET `/api/admin/email-templates`
**Get email templates**

**Response:**
```typescript
{
  templates: EmailTemplate[];
  schoolname: string;
}
```

**Usage:** Email template management

### PUT `/api/admin/email-templates`
**Update email template**

**Request Body:**
```typescript
{
  id: string;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  receivers: string[];
}
```

**Response:**
```typescript
{
  message: string;
  template: EmailTemplate;
}
```

**Usage:** Update email template content

### POST `/api/admin/email-test`
**Send test email**

**Request Body:**
```typescript
{
  templateId: string;
  testEmail: string;
}
```

**Response:**
```typescript
{
  message: string;
}
```

**Usage:** Test email templates

## Payment Endpoints

### POST `/api/payments/swish/qr-code`
**Generate Swish QR code**

**Request Body:**
```typescript
{
  amount: number;
  message: string;
  bookingId: string;
}
```

**Response:**
```typescript
{
  qrCode: string;
  swishUUID: string;
}
```

**Usage:** Swish payment processing

### POST `/api/payments/qliro/create-checkout`
**Create Qliro checkout**

**Request Body:**
```typescript
{
  amount: number;
  bookingId: string;
  customerEmail: string;
}
```

**Response:**
```typescript
{
  checkoutUrl: string;
  orderId: string;
}
```

**Usage:** Qliro payment processing

## Error Handling

All endpoints follow consistent error handling:

```typescript
// Success response
{
  success: true;
  data?: any;
}

// Error response
{
  success: false;
  error: string;
  status?: number;
}
```

## Authentication

Most endpoints require authentication using JWT tokens:

```typescript
// Required headers
{
  Authorization: "Bearer <jwt_token>";
}
```

## Rate Limiting

- Login attempts: 5 per minute
- Booking creation: 10 per minute
- Email sending: 20 per hour

## CORS Configuration

- Allowed origins: Configured in environment
- Methods: GET, POST, PUT, DELETE
- Headers: Content-Type, Authorization 