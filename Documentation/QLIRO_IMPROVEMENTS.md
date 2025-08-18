# Qliro Improvements & Modern Flow Implementation

## Overview

This document outlines the comprehensive improvements made to the Qliro payment integration, including the modern popup flow, enhanced error handling, and support for all booking types.

## 🚀 Key Improvements

### 1. Modern Popup Flow
- **Step-by-step progress indicators**: Visual feedback during payment process
- **Auto-detection**: Reads `qliro_checkout_flow` setting to choose flow type
- **Fallback mechanism**: Gracefully falls back to window flow if popup fails
- **Enhanced UX**: Better user experience with clear progress tracking

### 2. Enhanced Error Handling
- **Retry mechanism**: Automatic retry with exponential backoff for API calls
- **Comprehensive logging**: Detailed console debugging at every step
- **Toast notifications**: User-friendly error and success messages
- **Graceful degradation**: System continues working even if some components fail

### 3. Payment Method Filtering
- **Explicit Swish exclusion**: Qliro orders explicitly exclude Swish payment method
- **All other methods included**: Card, Invoice, DirectDebit, Klarna, PayPal
- **Configurable**: Easy to modify payment methods via Qliro dashboard

### 4. Cache Management
- **Smart caching**: 30-second settings cache with automatic refresh
- **Stale order cleanup**: Automatic cleanup of orders older than 24 hours
- **Database tracking**: Complete order lifecycle tracking in database

## 📋 Database Migrations

### Migration File: `drizzle/migrations/add_qliro_checkout_flow_setting.sql`

This migration adds the following settings to the `site_settings` table:

```sql
-- qliro_checkout_flow: Controls whether to use window or popup flow
-- qliro_debug_logs: Enables extended debug logging
-- qliro_retry_attempts: Number of retry attempts for API calls
-- qliro_cache_duration: Cache duration in seconds
```

### Running Migrations

```bash
# Run the migration script
node scripts/run-qliro-migration.js

# Or run the SQL directly
psql $DATABASE_URL -f drizzle/migrations/add_qliro_checkout_flow_setting.sql
```

## 🔧 Scripts

### 1. Migration Script: `scripts/run-qliro-migration.js`
- Sets up all required database settings
- Idempotent - can be run multiple times safely
- Provides verification of settings

### 2. Cleanup Script: `scripts/cleanup-stale-qliro-orders.js`
- Cleans up stale orders older than 24 hours
- Can be run as a cron job: `0 2 * * * node scripts/cleanup-stale-qliro-orders.js`
- Logs cleanup results for monitoring

### 3. Test Script: `scripts/test-qliro-flows.js`
- Comprehensive testing of all Qliro functionality
- Verifies settings, API connection, and error handling
- Provides manual testing checklist

## 🎯 Supported Booking Flows

### ✅ All Flows Supported

1. **Book as Admin**
   - Admin dashboard → Create booking → Select student → Choose Qliro
   - Uses modern popup flow with step-by-step progress

2. **Book as Teacher**
   - Teacher dashboard → Create booking → Select student → Choose Qliro
   - Same modern flow as admin bookings

3. **Book as Student**
   - Booking page → Select lesson → Choose Qliro
   - Works for both logged-in students and guest users

4. **Book as Guest**
   - Booking page → Select lesson → Fill guest info → Choose Qliro
   - Validates guest information before allowing Qliro payment

5. **Package Purchase**
   - Packages store → Select package → Choose Qliro
   - Handles package-specific payment flows

6. **Handledar Booking**
   - Handledar page → Select session → Choose Qliro
   - Special handling for handledarutbildning sessions

## 🔄 Flow Steps

### Modern Popup Flow (5 Steps)

1. **Warming up Qliro connection** - Simulates connection preparation
2. **Creating the Order** - Visual feedback for order creation
3. **Fetching the details** - Retrieves order data from Qliro API
4. **Show the Payment** - Displays Qliro checkout form
5. **Listening for completion** - Monitors payment completion

### Legacy Window Flow

- Opens Qliro checkout in new window
- Uses server-rendered raw route for better compatibility
- Handles completion via postMessage events

## 🛠️ Configuration

### Admin Settings

1. **Go to Admin Settings** → **Betalningsinställningar** → **Qliro**
2. **Set "Checkout Flow Type"**:
   - `window`: Legacy window flow (default)
   - `popup`: Modern popup flow with progress indicators

### Database Settings

```sql
-- Check current settings
SELECT key, value, description FROM site_settings 
WHERE key LIKE 'qliro_%';

-- Update flow type
UPDATE site_settings 
SET value = 'popup', updated_at = NOW() 
WHERE key = 'qliro_checkout_flow';
```

## 🐛 Debugging

### Console Logging

All Qliro operations include comprehensive console logging:

```javascript
// Examples of debug output
[QLIRO DEBUG] Creating order: { amount: 500, reference: "booking_123", description: "Körlektion" }
[QLIRO DEBUG] Order created: { checkoutId: "qliro_456", merchantReference: "booking_abc123" }
[QliroFlowManager] Using flow type: popup
[QliroModernPopup] Order data received: { orderId: "qliro_456", hasHtmlSnippet: true }
```

### Extended Debug Logging

Enable extended debug logging via admin settings:
- Set `qliro_debug_logs` to `true` in database
- Provides additional detailed logging

### Error Handling

- **Network errors**: Automatic retry with exponential backoff
- **API errors**: Detailed error messages with status codes
- **User errors**: Toast notifications for user-friendly feedback

## 📊 Monitoring

### Logs

All Qliro operations are logged via the application logger:

```javascript
logger.info('payment', 'Qliro checkout created successfully', {
  checkoutId: checkoutData.OrderId,
  merchantReference,
  hasPaymentLink: !!checkoutData.PaymentLink
});
```

### Metrics

- Order creation success/failure rates
- API response times
- Stale order cleanup statistics
- User flow completion rates

## 🔒 Security

### Authentication

- HMAC-SHA256 signature generation for all API requests
- API key validation on every request
- Webhook signature verification

### Data Protection

- Minimal PII in logs
- Secure token generation for callbacks
- Database encryption for sensitive data

## 🚀 Deployment

### Production Deployment

```bash
# 1. Build the application
npm run build

# 2. Run migrations
node scripts/run-qliro-migration.js

# 3. Restart the application
pm2 restart trafikskolax-prod

# 4. Test the flows
node scripts/test-qliro-flows.js
```

### Cron Jobs

Add to crontab for automatic cleanup:

```bash
# Clean up stale Qliro orders daily at 2 AM
0 2 * * * cd /var/www/dintrafikskolax_prod && node scripts/cleanup-stale-qliro-orders.js
```

## ✅ Testing Checklist

### Automated Tests

- [ ] Run `node scripts/test-qliro-flows.js`
- [ ] Verify all settings are properly configured
- [ ] Test API connection and retry mechanism
- [ ] Verify stale order cleanup works

### Manual Tests

- [ ] **Book as Admin**: Create booking for student with Qliro
- [ ] **Book as Teacher**: Create booking for student with Qliro
- [ ] **Book as Student**: Book lesson as logged-in student
- [ ] **Book as Guest**: Book lesson as guest user
- [ ] **Package Purchase**: Buy package with Qliro
- [ ] **Handledar Booking**: Book handledar session with Qliro

### Flow Verification

- [ ] Modern popup shows step-by-step progress
- [ ] Payment methods exclude Swish
- [ ] Completion redirects to correct page
- [ ] Error handling shows user-friendly messages
- [ ] Console logging provides debugging information

## 🎉 Success Criteria

The Qliro improvements are successful when:

1. ✅ All booking flows work with modern popup
2. ✅ Payment methods exclude Swish automatically
3. ✅ Error handling is robust and user-friendly
4. ✅ Debugging provides comprehensive information
5. ✅ Stale orders are automatically cleaned up
6. ✅ Settings are properly configured and cached
7. ✅ All user types can complete Qliro payments

## 📞 Support

For issues or questions:

1. Check console logs for detailed error information
2. Run `node scripts/test-qliro-flows.js` for diagnostics
3. Verify settings in admin panel
4. Check Qliro dashboard for order status
5. Review this documentation for configuration details
