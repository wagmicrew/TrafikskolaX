# Booking Slot Availability Improvements

This document outlines the improvements made to the booking system to properly handle temporary bookings and prevent double-booking.

## Problem

The booking system was not properly considering temporary bookings (`temp` status) when checking for available slots, which could lead to double-booking scenarios where:

1. A user creates a temporary booking (holds a slot)
2. Another user sees the slot as available and books it
3. Both bookings exist for the same time slot

## Solution

Updated all slot availability checks to include temporary bookings and filter out expired ones based on a time threshold.

## Changes Made

### 1. `findAvailableTeacher` Function (`app/api/booking/create/route.ts`)

**Before**: Only checked for non-cancelled bookings
**After**: 
- Includes temporary bookings in conflict detection
- Filters out expired temporary bookings (older than 10 minutes)
- Applies to both scheduled availability checks and fallback conflict checks

```typescript
// Filter out expired temporary bookings (older than 10 minutes)
const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
const activeConflictingBookings = conflictingBookings.filter(booking => {
  if (booking.status === 'temp' && new Date(booking.createdAt) < tenMinutesAgo) {
    return false; // Exclude expired temporary bookings
  }
  return true;
});
```

### 2. Available Slots Endpoint (`app/api/booking/available-slots/route.ts`)

**Before**: Only included `on_hold`, `booked`, and `confirmed` statuses
**After**: 
- Includes `temp` status in booking queries
- Filters out expired temporary and on_hold bookings

```typescript
// Updated query to include temporary bookings
or(
  eq(bookings.status, 'on_hold'), 
  eq(bookings.status, 'booked'), 
  eq(bookings.status, 'confirmed'),
  eq(bookings.status, 'temp') // Include temporary bookings to block slots
)

// Updated filtering logic
const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
if ((booking.status === 'on_hold' || booking.status === 'temp') && 
    new Date(booking.createdAt) < tenMinutesAgo) {
  return false;
}
```

### 3. Alternative Available Slots Endpoint (`app/api/bookings/available-slots/route.ts`)

**Before**: Used `not(eq(bookings.status, 'cancelled'))` which included temp bookings but didn't filter expired ones
**After**: 
- Explicitly includes temporary bookings
- Adds time-based filtering for expired temporary bookings

```typescript
// Added status and createdAt to query
const existingBookings = await db
  .select({
    startTime: bookings.startTime,
    endTime: bookings.endTime,
    status: bookings.status,
    createdAt: bookings.createdAt,
  })

// Added time-based filtering
const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
const isBooked = existingBookings.some(booking => {
  // Exclude expired temporary bookings (older than 10 minutes)
  if (booking.status === 'temp' && new Date(booking.createdAt) < tenMinutesAgo) {
    return false;
  }
  return booking.startTime === startTime && booking.endTime === endTime;
});
```

## Time Threshold

All implementations use a **10-minute threshold** for expired temporary bookings:
- Temporary bookings older than 10 minutes are considered expired
- Expired temporary bookings are excluded from availability checks
- This prevents slots from being permanently blocked by abandoned temporary bookings

## Booking Statuses Considered

### Active Bookings (Block Slots)
- `confirmed` - Confirmed and paid bookings
- `booked` - Booked but not yet confirmed
- `on_hold` - Waiting for payment (with 10-minute expiration)
- `temp` - Temporary bookings (with 10-minute expiration)

### Excluded Bookings (Don't Block Slots)
- `cancelled` - Cancelled bookings
- Expired `on_hold` bookings (older than 10 minutes)
- Expired `temp` bookings (older than 10 minutes)

## Benefits

1. **Prevents Double-Booking**: All active bookings (including temporary ones) block slots
2. **Automatic Cleanup**: Expired temporary bookings don't permanently block slots
3. **Consistent Behavior**: All slot availability endpoints now work the same way
4. **Better User Experience**: Users can't book slots that are temporarily held by others

## Testing

To test the improvements:

1. **Create a temporary booking** and verify the slot becomes unavailable
2. **Wait 10+ minutes** and verify the slot becomes available again
3. **Try to book the same slot** from another session while one is temporarily held
4. **Verify teacher assignment** considers all active bookings when finding available teachers

## Files Modified

1. `app/api/booking/create/route.ts` - Updated `findAvailableTeacher` function
2. `app/api/booking/available-slots/route.ts` - Updated slot availability logic
3. `app/api/bookings/available-slots/route.ts` - Updated alternative slot endpoint
4. `app/api/booking/slots/route.ts` - Already had proper implementation

## Environment Considerations

The 10-minute threshold is hardcoded but could be made configurable via environment variables if needed for different deployment environments. 