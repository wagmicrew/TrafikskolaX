# Unified Session Management System

This document describes the new unified session management system that merges Handledar and Teori session management into a single interface.

## Overview

The unified session management system provides a single point of administration for all types of sessions, including:
- Handledarutbildning (Supervisor Training)
- Riskettan Teori (Risk Education Theory)
- Riskettan Praktik (Risk Education Practice)
- Körlektion B (Driving Lessons Category B)

## Features

### 1. Unified Session Types
- **Session Types Table**: `session_types` - defines different types of sessions
- **Credit Integration**: Each session type can be linked to credit types for the credit system
- **Flexible Configuration**: Configure pricing, duration, participant limits, and requirements per session type

### 2. Unified Sessions
- **Sessions Table**: `sessions` - stores all session instances
- **Type-Based Configuration**: Each session inherits properties from its session type
- **Participant Management**: Track current vs max participants
- **Date/Time Management**: Full scheduling support

### 3. Enhanced Booking System
- **Session Bookings Table**: `session_bookings` - unified booking system
- **Encrypted Personal Data**: Personal identification numbers are encrypted for security
- **Supervisor Support**: Handle multiple supervisors per session
- **Payment Tracking**: Integrated payment status and method tracking

### 4. Email Notifications
- **Session Booking Confirmation**: Automatic email when booking is created
- **Payment Confirmations**: Notify when payments are received
- **Reminders**: Configurable reminder system
- **Cancellation Notifications**: Handle booking cancellations

## Database Schema

### Session Types (`session_types`)
```sql
- id: UUID (Primary Key)
- name: VARCHAR(255) - Display name
- description: TEXT - Detailed description
- type: ENUM - handledarutbildning, riskettan, teorilektion, handledarkurs
- credit_type: ENUM - Credit system integration
- base_price: DECIMAL - Base session price
- price_per_supervisor: DECIMAL - Additional supervisor cost
- duration_minutes: INTEGER - Session duration
- max_participants: INTEGER - Maximum participants
- allows_supervisors: BOOLEAN - Can have supervisors
- requires_personal_id: BOOLEAN - Requires personal ID for supervisors
- is_active: BOOLEAN - Active status
- sort_order: INTEGER - Display order
```

### Sessions (`sessions`)
```sql
- id: UUID (Primary Key)
- session_type_id: UUID - Reference to session type
- title: VARCHAR(255) - Session title
- description: TEXT - Session description
- date: DATE - Session date
- start_time: TIME - Start time
- end_time: TIME - End time
- max_participants: INTEGER - Max participants
- current_participants: INTEGER - Current participants
- teacher_id: UUID - Assigned teacher (optional)
- is_active: BOOLEAN - Active status
```

### Session Bookings (`session_bookings`)
```sql
- id: UUID (Primary Key)
- session_id: UUID - Reference to session
- student_id: UUID - Reference to student (optional)
- supervisor_name: VARCHAR(255) - Supervisor name
- supervisor_email: VARCHAR(255) - Supervisor email
- supervisor_phone: VARCHAR(50) - Supervisor phone
- supervisor_personal_number: TEXT - Encrypted personal ID
- supervisor_count: INTEGER - Number of supervisors
- status: VARCHAR(50) - Booking status
- price: DECIMAL - Total price
- payment_status: VARCHAR(50) - Payment status
- payment_method: VARCHAR(50) - Payment method
- swish_uuid: VARCHAR(255) - Swish transaction ID
- booked_by: UUID - Admin who created booking
- reminder_sent: BOOLEAN - Reminder email sent
```

## API Endpoints

### Session Types
- `GET /api/admin/session-types` - List all session types
- `POST /api/admin/session-types` - Create new session type
- `GET /api/admin/session-types/[id]` - Get specific session type
- `PUT /api/admin/session-types/[id]` - Update session type
- `DELETE /api/admin/session-types/[id]` - Delete session type

### Sessions
- `GET /api/admin/sessions` - List sessions with pagination
- `POST /api/admin/sessions` - Create new session
- `GET /api/admin/sessions/[id]` - Get specific session
- `PUT /api/admin/sessions/[id]` - Update session
- `DELETE /api/admin/sessions/[id]` - Delete session
- `GET /api/admin/sessions/[id]/participants` - Get session participants
- `POST /api/admin/sessions/[id]/add-booking` - Add booking to session
- `GET /api/admin/sessions/future` - Get future sessions

### Session Bookings
- `POST /api/admin/session-bookings/[id]` - Update booking (move, etc.)
- `DELETE /api/admin/session-bookings/[id]` - Delete booking

## Security Features

### Personal ID Encryption
- Personal identification numbers are encrypted using AES-256-GCM
- Only last 4 digits are displayed in the UI
- Encryption key stored in environment variables
- Separate encryption per booking for additional security

### Access Control
- Admin-only access to all endpoints
- Role-based permissions
- Audit trail with `booked_by` tracking

## Email Templates

The system includes the following email templates:
- `session-booking-confirmation` - Booking confirmation with payment details
- `session-reminder` - Configurable session reminders
- `session-cancellation` - Cancellation notifications
- `session-payment-confirmation` - Payment received confirmation
- `supervisor-assignment` - Supervisor assignment notifications

## Admin Interface

### Main Features
1. **Session Type Management**: Create and configure different session types
2. **Session Creation**: Create sessions from session types
3. **Participant Management**: Add/remove participants with proper validation
4. **Booking Management**: Handle bookings, payments, and cancellations
5. **Email Integration**: Automatic email notifications
6. **Search and Filter**: Find sessions by date, type, or status
7. **Pagination**: Handle large numbers of sessions efficiently

### UI Components
- **Tabbed Interface**: Future/Past sessions
- **Card-based Layout**: Clean, organized display
- **Modal Dialogs**: Proper z-index management
- **Toast Notifications**: User feedback
- **Form Validation**: Input validation and error handling

## Integration Points

### Credit System
- Session types link to credit types
- Automatic credit deduction on booking
- Credit validation before booking

### Payment System
- Swish integration for payments
- Payment status tracking
- Automatic payment confirmations

### User Management
- Link to existing student records
- Supervisor management
- Teacher assignment support

## Migration Notes

### From Existing Systems
The new system replaces:
- `/dashboard/admin/handledarkurs` - Handledar management
- `/dashboard/admin/teori-sessions` - Teori sessions

### Data Migration
- Existing handledar sessions can be migrated to the new system
- Teori sessions will be automatically included
- Booking data preserved with encryption applied

## Environment Variables

Add the following to your `.env` file:
```env
PERSONAL_ID_ENCRYPTION_KEY=your-secure-encryption-key-here
```

## Usage Examples

### Creating a Session Type
```javascript
// Handledarutbildning (Supervisor Training)
{
  name: 'Handledarutbildning',
  type: 'handledarutbildning',
  creditType: 'handledarutbildning',
  basePrice: 500.00,
  pricePerSupervisor: 500.00,
  durationMinutes: 120,
  maxParticipants: 2,
  allowsSupervisors: true,
  requiresPersonalId: true
}
```

### Creating a Session
```javascript
{
  sessionTypeId: 'uuid-of-session-type',
  title: 'Handledarutbildning - Januari 2025',
  description: 'Grundläggande handledarutbildning',
  date: '2025-01-15',
  startTime: '09:00',
  endTime: '11:00',
  maxParticipants: 2
}
```

### Adding a Booking
```javascript
{
  supervisorName: 'Anna Andersson',
  supervisorEmail: 'anna@example.com',
  supervisorPhone: '070-123-4567',
  personalId: '198512345678', // Will be encrypted
  supervisorCount: 1,
  studentId: 'uuid-of-student', // Optional
  sendPaymentEmail: true
}
```

## Support and Maintenance

### Regular Tasks
1. Monitor session capacity and overbooking
2. Check email delivery status
3. Review payment confirmations
4. Update session types as needed

### Troubleshooting
1. Check database connectivity
2. Verify email service configuration
3. Monitor encryption key security
4. Review audit logs for booking issues

This unified system provides a comprehensive solution for managing all types of driving school sessions with enhanced security, flexibility, and user experience.
