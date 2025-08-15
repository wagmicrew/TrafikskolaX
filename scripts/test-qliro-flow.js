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
    
    // Debug: Log relevant Qliro settings
    console.log('\n🔍 Debug - Raw database settings:');
    console.log('qliro_enabled:', settingsMap['qliro_enabled']);
    console.log('qliro_prod_enabled:', settingsMap['qliro_prod_enabled']);
    console.log('qliro_use_prod_env:', settingsMap['qliro_use_prod_env']);
    console.log('qliro_api_secret:', settingsMap['qliro_api_secret'] ? '***SET***' : '(empty)');
    console.log('qliro_secret:', settingsMap['qliro_secret'] ? '***SET***' : '(empty)');
    console.log('qliro_shared_secret:', settingsMap['qliro_shared_secret'] ? '***SET***' : '(empty)');

    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || settingsMap['public_app_url'] || '';
    
    // Determine environment and enabled flag (support legacy and prod/dev toggles)
    const envExplicit = settingsMap['qliro_environment'];
    const prodEnabled = settingsMap['qliro_prod_enabled'] === 'true' || settingsMap['qliro_use_prod_env'] === 'true';
    const baseEnabled = settingsMap['qliro_enabled'] === 'true';
    const environment = envExplicit === 'production' || prodEnabled ? 'production' : 'sandbox';
    const enabled = baseEnabled || prodEnabled;
    
    // Resolve API secret from multiple possible keys and env fallbacks
    const envApiSecret = process.env.QLIRO_API_SECRET || process.env.QLIRO_SHARED_SECRET || '';
    const apiSecret = (
      environment === 'production'
        ? (settingsMap['qliro_prod_api_secret'] || settingsMap['qliro_prod_shared_secret'] || '')
        : (settingsMap['qliro_api_secret'] || settingsMap['qliro_secret'] || settingsMap['qliro_shared_secret'] || '')
    ) || envApiSecret;
    
    console.log('\n🔍 Debug - Computed values:');
    console.log('baseEnabled:', baseEnabled);
    console.log('prodEnabled:', prodEnabled);
    console.log('final enabled:', enabled);
    console.log('apiSecret length:', apiSecret ? apiSecret.length : 0);
    console.log('environment:', environment);
    const apiUrl = environment === 'production' 
      ? (settingsMap['qliro_prod_api_url'] || 'https://payments.qit.nu')
      : (settingsMap['qliro_dev_api_url'] || 'https://pago.qit.nu');

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
