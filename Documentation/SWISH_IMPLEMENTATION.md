# Swish Payment Integration

## Configuration
```env
SWISH_ENVIRONMENT=sandbox|production
SWISH_MERCHANT_NUMBER=1231181189
SWISH_CALLBACK_URL=https://api.yourdomain.com/api/payments/swish/callback
SWISH_CERT_PATH=/path/to/swish.pem
```

## Core Implementation

### 1. Create Payment Request
```typescript
// Example payload
const payload = {
  payeePaymentReference: 'REF123',
  callbackUrl: process.env.SWISH_CALLBACK_URL,
  payeeAlias: process.env.SWISH_MERCHANT_NUMBER,
  amount: 10000, // 100 SEK in öre
  currency: 'SEK',
  message: 'Driving Lesson'
};
```

### 2. Handle Callback
```typescript
// Example callback handler
app.post('/api/payments/swish/callback', async (req, res) => {
  const { id, status } = req.body;
  
  // Update payment status in database
  await db.payment.update({
    where: { providerId: id },
    data: { status: status.toLowerCase() }
  });
  
  res.status(200).end();
});
```

## Error Handling
- **Timeout**: 10s request timeout
- **Retries**: 3 attempts for failed requests
- **Validation**: Verify amount and merchant ID

## Testing
- **Test Numbers**: 1231181189 (success), 1231231231 (failed)
- **Test Environment**: https://mss.cpc.getswish.net/swish-cpcapi/api/v2
