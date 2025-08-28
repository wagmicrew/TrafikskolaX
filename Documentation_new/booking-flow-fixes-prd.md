# Booking Flow Fixes - Product Requirements Document

## Executive Summary
Critical fixes required for the TrafikskolaX booking flow based on user feedback and UI/UX analysis. This document outlines specific issues identified from user interface screenshots and provides technical solutions.

## Issues Identified

### 1. Stepper Component Centering (Priority: High)
**Problem**: The booking stepper is not properly centered within its container, creating visual imbalance.
**Solution**: Update `booking-steps.tsx` to ensure proper centering with dynamic step counts.
**Files Affected**: `components/booking/booking-steps.tsx`

### 2. Unnecessary Navigation Buttons (Priority: Medium)
**Problem**: Redundant "Tillbaka" and "Välj" buttons create UI clutter when forward/backward navigation already exists.
**Solution**: Remove these buttons from relevant components.
**Files Affected**: 
- `components/booking/teori-session-selection.tsx`
- `components/booking/transmission-selection.tsx`
- Other booking step components

### 3. "Välj nästa tillgängliga tid" Button Malfunction (Priority: High)
**Problem**: Button claims no slots available within 30 days when slots actually exist in the database.
**Solution**: Fix the availability checking logic to properly query the database for actual available slots.
**Files Affected**: 
- `components/booking/week-calendar.tsx`
- Related API endpoints

### 4. Handledare Sessions Not Displaying (Priority: High)
**Problem**: Handledare sessions show "no available sessions" when sessions exist in `teori_sessions` table.
**Current Issue**: The query logic is not properly checking the `teori_sessions` table for handledare lesson types.
**Solution**: Fix the API endpoint to properly query `teori_sessions` with correct filters.
**Database Tables**: 
- `teori_sessions` (contains sessions with `lesson_type_id` matching handledare types)
- `teori_lesson_types` (contains lesson type definitions)
- `teori_bookings` (contains booking records)
- `teori_supervisors` (contains supervisor information)

### 5. Booking Confirmation Page Issues (Priority: High)
**Problems**:
- Double "Bekräfta bokning" headers
- Missing loading spinner on confirmation button
- Price calculation issues for teori sessions
- UI layout inconsistencies

**Solution**: Refactor the booking confirmation component to:
- Remove duplicate headers
- Add proper loading states
- Fix price calculation logic
- Improve UI consistency

**Files Affected**: `components/booking/booking-confirmation.tsx`

## Technical Implementation Plan

### Database Schema Verification
The system uses these key tables for teori/handledare bookings:
```sql
-- teori_sessions: Contains all theoretical sessions (both teori and handledare)
-- Key fields: id, lesson_type_id, start_time, end_time, max_participants, current_participants, is_active, price

-- teori_lesson_types: Contains lesson type definitions
-- Key fields: id, name, allows_supervisors, price_per_supervisor

-- teori_bookings: Contains booking records
-- Key fields: session_id, student_id, status, payment_status

-- teori_supervisors: Contains supervisor information for handledare bookings
-- Key fields: booking_id, name, email, phone, personal_number
```

### API Endpoints to Fix/Verify
1. `/api/teori/sessions` - Must properly filter by lesson type and availability
2. `/api/booking/check-capacity` - Must validate session capacity correctly
3. `/api/teori-sessions/[id]/book` - Must handle booking creation with proper validation

### Component Architecture
The booking flow follows this pattern:
1. `lesson-selection.tsx` - Choose lesson type
2. `teori-session-selection.tsx` - Choose specific session (for teori/handledare)
3. `booking-confirmation.tsx` - Confirm and pay
4. Success page

### Key Fixes Required

#### 1. Stepper Centering
```tsx
// Update booking-steps.tsx
<nav className="relative px-4 sm:px-6 lg:px-8" aria-label="Bokningssteg">
  <ol className="flex justify-center items-center max-w-4xl mx-auto"> // Changed from justify-between
    {/* Stepper content */}
  </ol>
</nav>
```

#### 2. Handledare Session Query Fix
The issue is in the session fetching logic. Need to ensure:
- Query `teori_sessions` table correctly
- Filter by `lesson_type_id` that matches handledare types
- Check `is_active = true`
- Calculate availability: `current_participants < max_participants`
- Include sessions in the future: `date >= CURRENT_DATE`

#### 3. Price Calculation Fix
Ensure teori session prices are fetched from:
1. `teori_sessions.price` (session-specific price)
2. Fallback to `teori_lesson_types.price` (lesson type default price)

#### 4. Loading States
Add proper loading spinners with OrbSpinner component:
```tsx
{loading && <OrbSpinner size="sm" />}
```

## Success Criteria
1. ✅ Stepper is visually centered in all screen sizes
2. ✅ Unnecessary navigation buttons removed
3. ✅ "Välj nästa tillgängliga tid" finds actual available slots
4. ✅ Handledare sessions display correctly when available
5. ✅ Booking confirmation page has single header and proper loading states
6. ✅ Price calculations work correctly for all lesson types
7. ✅ End-to-end booking flow works without errors

## Testing Requirements
1. Test booking flow for regular driving lessons
2. Test booking flow for teori sessions
3. Test booking flow for handledare sessions
4. Test responsive design on mobile/tablet
5. Test error handling for edge cases
6. Verify database transactions are atomic

## Files to Modify
1. `components/booking/booking-steps.tsx`
2. `components/booking/teori-session-selection.tsx`
3. `components/booking/booking-confirmation.tsx`
4. `components/booking/week-calendar.tsx`
5. `app/api/teori/sessions/route.ts`
6. Related API endpoints for capacity checking

## Risk Assessment
- **Low Risk**: UI/UX improvements (stepper, buttons)
- **Medium Risk**: Price calculation fixes
- **High Risk**: Database query modifications (requires careful testing)

## Timeline
- Analysis: ✅ Complete
- Implementation: 2-3 hours
- Testing: 1 hour
- Deployment: 30 minutes

## Notes
- Follow existing design patterns and Tailwind/Shadcn styling
- Maintain backward compatibility
- Use Drizzle ORM for all database operations
- Implement proper error handling and user feedback
- Ensure mobile-first responsive design
