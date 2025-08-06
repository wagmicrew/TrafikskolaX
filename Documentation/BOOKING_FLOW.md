# Booking Flow Documentation

## Overview
The booking system supports multiple user types and payment methods with different flows for each scenario.

## User Types and Booking Flows

### 1. Student Booking (Logged In)
- **Flow**: Student selects lesson → chooses time → confirms booking → pays
- **Email**: Sent to student's email
- **Status**: `temp` → `confirmed` (after payment)

### 2. Guest Booking (Not Logged In)
- **Flow**: Guest selects lesson → chooses time → enters details → confirms booking → pays
- **Email**: Sent to guest's email
- **Status**: `temp` → `confirmed` (after payment)

### 3. Admin/Teacher Booking for Student
- **Flow**: Admin creates dummy booking → selects student → confirms booking
- **Email**: Sent to selected student's email (NOT admin's email)
- **Status**: `temp` → `confirmed` (after student assignment)

### 4. Handledar Session Booking
- **Flow**: User selects handledar session → enters supervisor details → confirms booking → pays
- **Email**: Sent to supervisor's email
- **Status**: `temp` → `confirmed` (after payment)

## Payment Methods

### Swish Payment Flow
1. **User selects Swish**: Booking status becomes `payment_avvaktande`
2. **Email notification**: School receives email about pending Swish payment
3. **Manual verification**: Admin checks Swish app and confirms/declines payment
4. **Confirmation**: Booking status becomes `confirmed` or `cancelled`

### Other Payment Methods
- **Qliro**: Automatic confirmation after successful payment
- **Already Paid**: Immediate confirmation for admin bookings
- **Credits**: Immediate confirmation if user has sufficient credits

## API Endpoints

### Booking Creation
- **POST** `/api/booking/create` - Creates new booking
- **POST** `/api/booking/confirm` - Confirms booking with payment method
- **PUT** `/api/booking/update-student` - Updates booking with selected student (admin/teacher)
- **POST** `/api/booking/confirm-swish-payment` - Confirms/declines Swish payment (admin)

### Email Templates
- **Swish Payment Verification**: `swish_payment_verification` trigger
- **Booking Confirmation**: `booking_confirmed` trigger

## Database Schema

### Booking Status Values
- `temp` - Temporary booking (holds timeslot)
- `payment_avvaktande` - Waiting for payment verification (Swish)
- `confirmed` - Booking confirmed and paid
- `cancelled` - Booking cancelled

### Payment Status Values
- `pending` - Payment pending verification
- `paid` - Payment confirmed
- `failed` - Payment failed/declined

## Email Routing Logic

```typescript
// Email routing based on booking type
if (isAdminOrTeacher && studentId) {
  // Send to selected student
  emailTo = studentEmail
} else if (isGuestBooking) {
  // Send to guest email
  emailTo = guestEmail
} else {
  // Send to logged-in user
  emailTo = userEmail
}
```

## Admin Dashboard Features

### Booking Management
- View all bookings with status filters
- Confirm/decline Swish payments
- Update booking details
- Send manual notifications

### Email Templates
- Swish payment verification template
- Booking confirmation template
- Customizable email content

## Security Considerations

### Authentication
- Admin/teacher endpoints require proper authentication
- Student endpoints require user authentication or guest validation
- Payment confirmation requires admin privileges

### Data Integrity
- Dummy bookings prevent orphaned records
- Student assignment validates user existence
- Payment verification prevents fraud

## Error Handling

### Common Error Scenarios
- **Invalid student ID**: Returns 404 if student not found
- **Unauthorized access**: Returns 401 for insufficient permissions
- **Invalid booking status**: Returns 400 for invalid status transitions
- **Payment verification failed**: Returns 400 for invalid payment confirmation

### Recovery Procedures
- **Failed Swish payment**: Admin can decline and booking becomes cancelled
- **Orphaned bookings**: Cleanup API removes temporary bookings
- **Email delivery failure**: System logs errors and continues processing
