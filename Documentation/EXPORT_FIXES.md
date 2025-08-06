# Export Functionality Fixes

This document outlines the fixes implemented for the booking export functionality and email sending issues.

## Issues Addressed

### 1. Export Functionality - URL Parsing Issue
**Problem**: `TypeError: Failed to parse URL` when calling export functions from server-side environment
**Root Cause**: `fetch` calls in `utils/pdfExport.ts` were using relative URLs in server environment
**Solution**: Added `getBaseUrl()` helper function to construct absolute URLs
**Result**: All export functions now work in both browser and server environments

### 2. Export Functionality - Authentication Issue
**Problem**: 401 Unauthorized errors when calling booking APIs from server-side
**Root Cause**: Export functions didn't have access to authentication cookies when called from server
**Solution**: Modified export functions to accept `authToken` parameter and pass it in request headers
**Result**: All 6 export tests now pass successfully

### 3. Email Sending Issue - Admin/Teacher Bookings
**Problem**: Admin-created bookings sent emails to admin instead of selected student
**Root Cause**: Complex booking creation flow with mixed email logic
**Solution**: Created dedicated API endpoints for admin/teacher bookings with proper email routing
**Result**: Emails now sent to the correct student

## New API Endpoints

### `/api/admin/bookings/create-for-student`
- **Purpose**: Dedicated endpoint for admin bookings with proper email routing
- **Authentication**: Requires admin role
- **Email**: Sends confirmation emails to the selected student
- **Key Feature**: Sets `userId` to the selected student's ID

### `/api/teacher/bookings/create-for-student`
- **Purpose**: Dedicated endpoint for teacher bookings with proper email routing
- **Authentication**: Requires teacher role
- **Email**: Sends confirmation emails to the selected student
- **Key Feature**: Sets `userId` to the selected student's ID

## Updated Components

### `components/booking/booking-confirmation.tsx`
- **Change**: Modified to use new dedicated API endpoints
- **Logic**: Routes to appropriate endpoint based on user role (admin vs teacher)
- **Email**: Ensures emails are sent to the selected student

## Testing Infrastructure

### `/api/admin/test-export-functions`
- **Purpose**: Comprehensive testing of all export functions
- **Tests**: 6 different scenarios (teacher/admin × daily/weekly/future)
- **UI Integration**: Button in admin settings troubleshooting tab

## Key Technical Changes

### `utils/pdfExport.ts`
```typescript
// Added base URL helper
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '';
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.VERCEL_URL || 
                  'http://localhost:3000';
  return baseUrl;
};

// Updated function signatures
export const fetchAllFutureBookings = async (
  userId?: string, 
  role: 'admin' | 'teacher' = 'teacher', 
  authToken?: string
) => {
  // ... implementation with auth token support
};
```

### Email Context Creation
```typescript
// In new booking endpoints
const emailContext = {
  user: {
    id: student.id,           // Student's ID
    email: student.email,     // Student's email
    firstName: student.firstName,
    lastName: student.lastName,
    role: student.role
  },
  booking: {
    // ... booking details
  }
};
```

## Verification

### Export Functions
- ✅ All 6 export tests pass
- ✅ No more URL parsing errors
- ✅ Authentication working correctly
- ✅ Both teacher and admin roles supported

### Email Sending
- ✅ Admin bookings send emails to selected student
- ✅ Teacher bookings send emails to selected student
- ✅ Proper email context with student information
- ✅ Confirmation emails sent via email template service

## Files Modified

1. `utils/pdfExport.ts` - Added base URL helper and auth token support
2. `app/api/admin/test-export-functions/route.ts` - Created test endpoint
3. `app/api/admin/bookings/create-for-student/route.ts` - New admin booking endpoint
4. `app/api/teacher/bookings/create-for-student/route.ts` - New teacher booking endpoint
5. `components/booking/booking-confirmation.tsx` - Updated to use new endpoints
6. `app/dashboard/admin/settings/settings-client.tsx` - Added test button

## Environment Variables

Ensure these environment variables are set:
- `NEXT_PUBLIC_APP_URL` - Base URL for server-side requests
- `VERCEL_URL` - Fallback for Vercel deployments
- `NEXT_PUBLIC_SWISH_NUMBER` - Swish number for payment references 