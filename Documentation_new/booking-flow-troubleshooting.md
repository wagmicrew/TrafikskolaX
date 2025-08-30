# Booking Flow Troubleshooting Guide

## Overview
This document outlines common issues in the TrafikskolaX booking flow and their solutions, focusing on the teori session booking and confirmation process.

## Current Issues & Solutions

### 1. Booking Confirmation Component Issues

#### Problem: Syntax Errors in booking-confirmation.tsx
**Symptoms:**
- JSX compilation errors
- Unclosed HTML tags
- Broken component structure
- TypeScript errors

**Root Cause:**
- Incomplete JSX structure starting around line 175
- Missing closing tags and improper nesting
- Mixed function and JSX code without proper separation

**Solution:**
- Completely restructure the component with proper JSX hierarchy
- Separate utility functions from component logic
- Implement proper error boundaries and loading states

#### Problem: Session Data Fetching Issues
**Symptoms:**
- Incorrect price display
- Wrong session duration calculation
- Missing handledare (supervisor) information

**Root Cause:**
- Fetching from wrong API endpoints
- Not using teori_sessions table properly
- Missing lesson type data joins

**Solution:**
- Use `/api/teori-sessions/[id]` endpoint for session details
- Implement proper data mapping from session to booking state
- Add error handling for failed API calls

### 2. Handledare (Supervisor) Logic Issues

#### Problem: Handledare Display Logic
**Symptoms:**
- Handledare options not showing correctly
- Price calculations incorrect
- Supervisor count not updating properly

**Root Cause:**
- Mixed handledare UI and booking confirmation logic
- Price calculation not accounting for supervisor costs
- Missing validation for supervisor requirements

**Solution:**
- Create separate HandledareRecap component
- Implement proper price calculation with supervisor costs
- Add validation for supervisor count and details

### 3. Role-Based Student Selection Issues

#### Problem: Student Selection Not Working by Role
**Symptoms:**
- Admin users can't select students
- Regular users see unnecessary student selection UI
- Student information not properly populated

**Root Cause:**
- Missing role-based conditional rendering
- Student selection state not properly initialized
- No proper handling of guest vs authenticated users

**Solution:**
- Implement role-based UI logic with isAdminOrTeacher checks
- Create StudentSelectionForm component for admins
- Auto-populate student info for regular users

### 4. Debug Mode Implementation Issues

#### Problem: Debug Mode Not Functional
**Symptoms:**
- No debug logging in booking flow
- Missing debug API endpoint integration
- Debug mode toggle not working

**Root Cause:**
- Debug mode state not properly managed
- Missing integration with `/api/config/debug` endpoint
- No debug logging in booking submission

**Solution:**
- Implement debug mode toggle in UI
- Add debug logging to booking submission
- Create debug information display component

## Modular Component Structure

### Proposed Architecture

```
components/booking/
├── booking-confirmation.tsx          # Main component
├── handledare-recap.tsx              # Supervisor recap component
├── student-selection-form.tsx        # Student selection for admins
├── booking-summary.tsx               # Price and details summary
├── payment-methods.tsx               # Payment method selection
└── debug-panel.tsx                   # Debug mode panel
```

### Benefits of Modular Design

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be reused across different booking flows
3. **Testing**: Easier to unit test individual components
4. **Performance**: Better code splitting and lazy loading
5. **Developer Experience**: Cleaner code organization and debugging

## Implementation Strategy

### Phase 1: Core Fixes
1. Fix syntax errors in booking-confirmation.tsx
2. Implement proper session data fetching
3. Add error handling and loading states

### Phase 2: Modular Components
1. Extract HandledareRecap component
2. Create StudentSelectionForm component
3. Implement PaymentMethods component

### Phase 3: Enhanced Features
1. Add debug mode functionality
2. Implement proper validation
3. Add comprehensive error handling

### Phase 4: Testing & Documentation
1. Create unit tests for each component
2. Add integration tests for booking flow
3. Update this troubleshooting guide

## API Endpoints Used

### `/api/teori-sessions/[id]`
- **Purpose**: Fetch detailed session information
- **Returns**: Session data with lesson type and pricing
- **Usage**: Called on component mount to populate booking data

### `/api/config/debug`
- **Purpose**: Get debug mode status
- **Returns**: Boolean indicating if debug mode is enabled
- **Usage**: Called to determine debug logging level

### `/api/booking/check-capacity`
- **Purpose**: Validate session capacity before booking
- **Returns**: Capacity validation result
- **Usage**: Called before booking submission

## Common Error Scenarios

### Scenario 1: Session Data Not Loading
```
Error: "Failed to fetch session details"
Solution:
1. Check if sessionId is provided in bookingData
2. Verify API endpoint is accessible
3. Check for network connectivity issues
4. Review server logs for API errors
```

### Scenario 2: Price Calculation Errors
```
Error: "Incorrect total price calculation"
Solution:
1. Verify session price from API response
2. Check supervisor cost calculation
3. Validate lesson type pricing data
4. Review booking state updates
```

### Scenario 3: Student Selection Issues
```
Error: "Student selection not working for admin users"
Solution:
1. Check isAdminOrTeacher flag
2. Verify selectedStudent state management
3. Review StudentSelectionForm component
4. Check for authentication issues
```

## Environment Variables

### Required Environment Variables
- `DEBUG_MODE`: Enable/disable debug mode (default: false)
- `NEXT_PUBLIC_API_URL`: API base URL for client-side calls

### Optional Environment Variables
- `MAX_SUPERVISOR_COUNT`: Maximum allowed supervisors per booking
- `PAYMENT_REDIRECT_URL`: URL to redirect after payment

## Monitoring & Logging

### Debug Mode Features
- Booking data logging before submission
- API response logging
- State change tracking
- Error boundary logging

### Production Monitoring
- Error tracking with Sentry
- Performance monitoring
- User journey analytics
- Booking conversion tracking

## Testing Strategy

### Unit Tests
- Component rendering tests
- State management tests
- Utility function tests
- API integration tests

### Integration Tests
- Complete booking flow tests
- Payment integration tests
- Role-based access tests

### E2E Tests
- User journey tests
- Cross-browser compatibility
- Mobile responsiveness tests

## Deployment Checklist

- [ ] Fix syntax errors in booking-confirmation.tsx
- [ ] Implement session data fetching
- [ ] Add error handling and loading states
- [ ] Create modular components
- [ ] Implement debug mode
- [ ] Add comprehensive testing
- [ ] Update documentation
- [ ] Performance optimization
- [ ] Security review

## Contact & Support

For technical issues or questions about this booking flow:
1. Check this troubleshooting guide first
2. Review component documentation
3. Check server logs for API errors
4. Create issue with detailed reproduction steps

---

*Last Updated: 2025-08-29*
*Version: 1.0.0*
