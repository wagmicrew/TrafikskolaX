# Qliro One Integration

## Configuration
```env
QLIRO_ENVIRONMENT=sandbox|production
QLIRO_MERCHANT_ID=your_merchant_id
QLIRO_API_KEY=your_api_key
QLIRO_SECRET=your_shared_secret
QLIRO_CALLBACK_URL=https://api.yourdomain.com/api/payments/qliro/callback
```

## Core Implementation

### 1. Create Payment Order
```typescript
// Example payload
const order = {
  merchant: {
    merchantId: process.env.QLIRO_MERCHANT_ID,
    subscriptionId: '1234567890',
    callbackUrl: process.env.QLIRO_CALLBACK_URL
  },
  order: {
    orderId: 'ORDER123',
    currency: 'SEK',
    totalAmount: 9900, // 99 SEK in öre
    items: [
      {
        id: 'LESSON-1',
        name: 'Driving Lesson',
        quantity: 1,
        unitPrice: 9900,
        vatRate: 0
      }
    ]
  },
  customer: {
    email: 'customer@example.com',
    phoneNumber: '+46701234567',
    firstName: 'John',
    lastName: 'Doe'
  }
};
```

### 2. Handle Callback
```typescript
// Example callback handler
app.post('/api/payments/qliro/callback', async (req, res) => {
  const signature = req.headers['qliro-signature'];
  const payload = req.body;
  
  // Verify signature
  const isValid = verifySignature(payload, signature);
  
  if (isValid) {
    const { orderId, status } = payload;
    
    // Update order status in database
    await db.order.update({
      where: { orderId },
      data: { status }
    });
    
    res.status(200).json({ received: true });
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});
```

## Security
- **API Key**: Sent in `X-API-Key` header
- **Signature**: HMAC-SHA256 of payload
- **HTTPS**: Required for all endpoints

## Testing
- **Test Cards**:
  - 4103 2100 0000 0002 (success)
  - 4103 2100 0000 0003 (failed)
- **Test Environment**: https://api.qlironline.com/v1/orders

## Error Handling
- **400**: Invalid request
- **401**: Unauthorized
- **403**: Forbidden
- **429**: Rate limited
- **5xx**: Server error
