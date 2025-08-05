# Booking Flow Documentation

## Overview
The booking system allows students to schedule driving lessons, view availability, and manage their bookings. This document outlines the complete booking flow and related components.

## Booking States

| State | Description | Possible Next States |
|-------|-------------|----------------------|
| `temp` | Temporary booking (not confirmed) | `on_hold`, `cancelled` |
| `on_hold` | Payment pending | `confirmed`, `cancelled` |
| `confirmed` | Booking is confirmed | `completed`, `cancelled` |
| `completed` | Lesson has been completed | - |
| `cancelled` | Booking was cancelled | - |

## Booking Flow

### 1. Availability Check
- User selects date, time, and lesson type
- System checks teacher and car availability
- Returns available time slots

### 2. Temporary Booking
- Creates a temporary booking (15-minute hold)
- Prevents double-booking
- Returns booking ID for payment

### 3. Payment Processing
- User selects payment method (Swish/Qliro)
- System processes payment
- On success, updates booking to `on_hold`

### 4. Confirmation
- System sends confirmation email
- Updates calendar with booking
- Sends notification to teacher

## Database Tables

### `bookings`
- `id` (uuid): Unique booking ID
- `userId` (uuid): Student ID
- `teacherId` (uuid): Assigned teacher
- `carId` (uuid): Assigned vehicle
- `lessonTypeId` (uuid): Type of lesson
- `scheduledDate` (date): Booking date
- `startTime`/`endTime` (time): Time slot
- `status` (enum): Booking state
- `paymentStatus` (enum): Payment state
- `totalPrice` (decimal): Booking cost

### `booking_availability`
- `id` (uuid)
- `teacherId` (uuid)
- `date` (date)
- `startTime` (time)
- `endTime` (time)
- `isAvailable` (boolean)

## API Endpoints

### Get Availability
```
GET /api/availability
Params: date, lessonTypeId
```

### Create Booking
```
POST /api/bookings
Body: {
  lessonTypeId: string,
  scheduledDate: string (ISO date),
  startTime: string (HH:MM),
  teacherId: string,
  paymentMethod: 'swish' | 'qliro' | 'invoice'
}
```

### Update Booking
```
PATCH /api/bookings/:id
Body: {
  status?: 'cancelled' | 'completed',
  paymentStatus?: 'paid' | 'failed' | 'refunded'
}
```

## Error Handling

| Error Code | Description | Resolution |
|------------|-------------|-------------|
| 400 | Invalid input | Check request body |
| 403 | Not authorized | Login required |
| 409 | Time slot taken | Show updated availability |
| 422 | Validation error | Show error details |
| 500 | Server error | Retry or contact support |

## Notifications

### Email Templates
- `booking_created`: Sent on new booking
- `booking_confirmed`: Payment received
- `booking_reminder`: 24h before lesson
- `booking_cancelled`: On cancellation

### Push Notifications
- New booking assignment (teacher)
- Upcoming lesson (30 min before)
- Booking changes

## Testing

### Test Cases
1. **Happy Path**
   - Check availability
   - Create booking
   - Process payment
   - Confirm booking
   - Complete lesson

2. **Error Cases**
   - Double booking
   - Expired hold
   - Payment failure
   - Cancellation policy
