// Test script to verify complete Qliro flow with new authorization
require('dotenv').config();

// Import database and service modules
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

// Simple Qliro service implementation for testing
class QliroTestService {
  constructor() {
    this.settings = null;
  }

  async loadSettings() {
    if (this.settings) return this.settings;

    const sql = neon(process.env.DATABASE_URL);
    const settings = await sql`SELECT key, value FROM site_settings`;
    const settingsMap = settings.reduce((acc, setting) => {
      if (setting.key) acc[setting.key] = setting.value || '';
      return acc;
    }, {});

    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || settingsMap['public_app_url'] || '';
    const environment = settingsMap['qliro_environment'] === 'production' ? 'production' : 'sandbox';
    const enabled = settingsMap['qliro_enabled'] === 'true';
    const apiSecret = settingsMap['qliro_api_secret'] || process.env.QLIRO_API_SECRET || '';
    const apiUrl = environment === 'production' 
      ? 'https://api.qliro.com' 
      : 'https://playground.qliro.com';

    this.settings = {
      enabled,
      apiSecret,
      apiUrl,
      environment,
      publicUrl,
    };

    return this.settings;
  }

  async isEnabled() {
    try {
      const settings = await this.loadSettings();
      return settings.enabled && !!settings.apiSecret;
    } catch (error) {
      return false;
    }
  }

  async getResolvedSettings() {
    const settings = await this.loadSettings();
    const mask = (v) => (v ? `${v.slice(0, 4)}...${v.slice(-4)}` : '');
    return {
      enabled: settings.enabled,
      environment: settings.environment,
      apiUrl: settings.apiUrl,
      publicUrl: settings.publicUrl,
      hasApiSecret: !!settings.apiSecret,
      apiSecretMasked: mask(settings.apiSecret),
    };
  }

  generateAuthHeader(payload) {
    const token = crypto.createHmac('sha256', this.settings.apiSecret)
      .update(payload)
      .digest('hex');
    return `Bearer ${token}`;
  }

  async createCheckout(params) {
    const settings = await this.loadSettings();
    const merchantReference = params.reference.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50);
    
    const checkoutRequest = {
      MerchantApiKey: settings.apiSecret,
      MerchantReference: merchantReference,
      Currency: 'SEK',
      Country: 'SE',
      Language: 'sv-se',
      MerchantTermsUrl: `${settings.publicUrl}/terms`,
      MerchantConfirmationUrl: params.returnUrl,
      MerchantCheckoutStatusPushUrl: `${settings.publicUrl}/api/payments/qliro/webhook`,
      OrderItems: [{
        MerchantReference: 'service',
        Description: params.description,
        Quantity: 1,
        PricePerItemIncVat: params.amount / 100,
        PricePerItemExVat: (params.amount / 100) / 1.25,
        VatRate: 25.00
      }]
    };

    if (params.customerEmail) {
      checkoutRequest.CustomerInformation = {
        Email: params.customerEmail,
        MobileNumber: params.customerPhone || undefined
      };
    }

    const bodyString = JSON.stringify(checkoutRequest);
    const url = `${settings.apiUrl}/checkout/merchantapi/Orders`;
    const authHeader = this.generateAuthHeader(bodyString);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json', 
        'Authorization': authHeader,
        'User-Agent': 'TrafikskolaX/1.0'
      },
      body: bodyString
    });

    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`CreateCheckout error: ${response.status} ${response.statusText} - ${text}`);
    }

    const checkoutData = JSON.parse(text);
    
    return {
      checkoutId: checkoutData.OrderId,
      checkoutUrl: checkoutData.PaymentLink,
      merchantReference
    };
  }

  async getOrder(orderId) {
    const settings = await this.loadSettings();
    const url = `${settings.apiUrl}/checkout/merchantapi/Orders/${orderId}`;
    
    const emptyPayload = '';
    const authHeader = this.generateAuthHeader(emptyPayload);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': authHeader }
    });
    
    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`GetOrder error: ${response.status} ${response.statusText} - ${text}`);
    }
    
    return JSON.parse(text);
  }
}

const qliroService = new QliroTestService();

async function testQliroFlow() {
  console.log('=== Testing Complete Qliro Flow ===');
  
  try {
    // Use our test service instance
    
    // Test 1: Check if enabled
    console.log('\n1. Checking if Qliro is enabled...');
    const isEnabled = await qliroService.isEnabled();
    console.log(`Qliro enabled: ${isEnabled}`);
    
    if (!isEnabled) {
      return {
        success: false,
        message: 'Qliro is not enabled in settings'
      };
    }
    
    // Test 2: Get resolved settings (masked)
    console.log('\n2. Getting resolved settings...');
    const settings = await qliroService.getResolvedSettings();
    console.log('Settings:', {
      enabled: settings.enabled,
      environment: settings.environment,
      apiUrl: settings.apiUrl,
      publicUrl: settings.publicUrl,
      hasApiKey: settings.hasApiKey,
      hasApiSecret: settings.hasApiSecret,
      apiKeyMasked: settings.apiKeyMasked
    });
    
    // Test 3: Create test order
    console.log('\n3. Creating test order...');
    const testReference = `TEST-FLOW-${Date.now()}`;
    const testOrder = await qliroService.createCheckout({
      amount: 10000, // 100 SEK in öre
      reference: testReference,
      description: 'Test order for flow verification',
      returnUrl: `${settings.publicUrl}/test-return`,
      customerEmail: 'test@example.com',
      customerFirstName: 'Test',
      customerLastName: 'User',
      customerPhone: '+46701234567'
    });
    
    console.log('✅ Order created successfully');
    console.log(`Order ID: ${testOrder.checkoutId}`);
    console.log(`Payment URL: ${testOrder.checkoutUrl}`);
    console.log(`Merchant Reference: ${testOrder.merchantReference}`);
    
    // Test 4: Fetch order status
    console.log('\n4. Fetching order status...');
    const orderStatus = await qliroService.getOrder(testOrder.checkoutId);
    console.log('✅ Order status fetched successfully');
    console.log(`Status: ${orderStatus.CustomerCheckoutStatus || 'Unknown'}`);
    console.log(`Total Price: ${orderStatus.TotalPrice || 'Unknown'}`);
    console.log(`Currency: ${orderStatus.Currency || 'Unknown'}`);
    
    // Test 5: Verify payment link is accessible
    console.log('\n5. Verifying payment link...');
    if (testOrder.checkoutUrl) {
      console.log('✅ Payment link is available');
      console.log(`Payment Link: ${testOrder.checkoutUrl}`);
    } else {
      console.log('⚠️ No payment link in response');
    }
    
    return {
      success: true,
      message: 'Complete Qliro flow test passed',
      details: {
        orderId: testOrder.checkoutId,
        paymentUrl: testOrder.checkoutUrl,
        merchantReference: testOrder.merchantReference,
        status: orderStatus.CustomerCheckoutStatus
      }
    };
    
  } catch (error) {
    console.error('❌ Flow test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    };
  }
}

// Run if called directly
if (require.main === module) {
  testQliroFlow()
    .then(result => {
      console.log('\n=== Test Result ===');
      console.log(`Success: ${result.success}`);
      console.log(`Message: ${result.message}`);
      if (result.details) {
        console.log('Details:', result.details);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test script error:', error);
      process.exit(1);
    });
}

module.exports = testQliroFlow;
