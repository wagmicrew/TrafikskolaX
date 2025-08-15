const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require');

async function testQliroConnectivity() {
  try {
    console.log('🔍 Testing Qliro API connectivity...\n');
    
    // Step 1: Check Qliro settings in database
    console.log('1. Checking Qliro settings in database...');
    const settings = await sql`
      SELECT key, value, category 
      FROM site_settings 
      WHERE category = 'payment' AND key LIKE 'qliro%'
      ORDER BY key
    `;
    
    if (settings.length === 0) {
      console.log('❌ No Qliro settings found in database');
      console.log('   Please configure Qliro settings in the admin panel');
      return;
    }
    
    console.log('✅ Found Qliro settings:');
    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
      // Don't log sensitive values
      const displayValue = setting.key.includes('secret') || setting.key.includes('key') 
        ? '***HIDDEN***' 
        : setting.value;
      console.log(`   ${setting.key}: ${displayValue}`);
    });
    
    // Step 2: Validate required settings
    console.log('\n2. Validating required settings...');
    const requiredSettings = ['qliro_enabled', 'qliro_api_url', 'qliro_api_key', 'qliro_api_secret'];
    const missingSettings = requiredSettings.filter(key => !settingsMap[key]);
    
    if (missingSettings.length > 0) {
      console.log('❌ Missing required settings:', missingSettings);
      return;
    }
    
    if (settingsMap.qliro_enabled !== 'true') {
      console.log('❌ Qliro is not enabled (qliro_enabled != "true")');
      return;
    }
    
    console.log('✅ All required settings present and Qliro is enabled');
    
    // Step 3: Check API URL accessibility
    console.log('\n3. Testing API URL accessibility...');
    const apiUrl = settingsMap.qliro_api_url;
    console.log(`   Testing: ${apiUrl}`);
    
    try {
      // Test basic connectivity to the API base URL
      const testResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'TrafikskolaX-Test/1.0'
        }
      });
      
      console.log(`✅ API URL is reachable (Status: ${testResponse.status})`);
    } catch (fetchError) {
      console.log('❌ Cannot reach Qliro API URL:', fetchError.message);
      console.log('   Common causes:');
      console.log('   - Network connectivity issues');
      console.log('   - Firewall blocking outbound requests');
      console.log('   - Incorrect API URL');
      console.log('   - DNS resolution problems');
      return;
    }
    
    // Step 4: Check public URL setting
    console.log('\n4. Checking public URL configuration...');
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || settingsMap.qliro_public_url;
    
    if (!publicUrl) {
      console.log('❌ No public URL configured');
      console.log('   Set NEXT_PUBLIC_APP_URL environment variable or qliro_public_url in settings');
      return;
    }
    
    if (!publicUrl.startsWith('https://')) {
      console.log('❌ Public URL must use HTTPS:', publicUrl);
      return;
    }
    
    console.log('✅ Public URL configured:', publicUrl);
    
    // Step 5: Test a minimal API call
    console.log('\n5. Testing Qliro API authentication...');
    
    // Create a minimal test payload
    const testPayload = {
      MerchantApiKey: settingsMap.qliro_api_key,
      MerchantReference: `test_${Date.now()}`,
      Currency: 'SEK',
      Country: 'SE',
      Language: 'sv-se',
      MerchantTermsUrl: `${publicUrl}/kopvillkor`,
      MerchantConfirmationUrl: `${publicUrl}/test`,
      MerchantCheckoutStatusPushUrl: `${publicUrl}/api/payments/qliro/test`,
      OrderItems: [{
        MerchantReference: `test_${Date.now()}`,
        Description: 'Test Order',
        Type: 'Product',
        Quantity: 1,
        PricePerItemIncVat: 100,
        PricePerItemExVat: 100,
        VatRate: 0,
      }],
    };
    
    const bodyString = JSON.stringify(testPayload);
    
    // Generate auth header (simplified version)
    const crypto = require('crypto');
    const input = bodyString + settingsMap.qliro_api_secret;
    const hash = crypto.createHash('sha256').update(input).digest('base64');
    const authHeader = `Qliro ${hash}`;
    
    try {
      const testOrderResponse = await fetch(`${apiUrl}/checkout/merchantapi/Orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authHeader
        },
        body: bodyString,
      });
      
      const responseText = await testOrderResponse.text();
      
      if (testOrderResponse.ok) {
        console.log('✅ Qliro API authentication successful');
        console.log('   Test order created successfully');
        
        try {
          const responseData = JSON.parse(responseText);
          console.log(`   Order ID: ${responseData.OrderId}`);
          console.log(`   Has Payment Link: ${!!responseData.PaymentLink}`);
        } catch (e) {
          console.log('   Response parsing failed, but request succeeded');
        }
      } else {
        console.log(`❌ Qliro API returned error: ${testOrderResponse.status} ${testOrderResponse.statusText}`);
        console.log('   Response:', responseText);
        
        // Try to parse error details
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.ErrorCode) {
            console.log(`   Error Code: ${errorData.ErrorCode}`);
          }
          if (errorData.ErrorMessage) {
            console.log(`   Error Message: ${errorData.ErrorMessage}`);
          }
        } catch (e) {
          console.log('   Could not parse error response');
        }
      }
    } catch (apiError) {
      console.log('❌ Failed to call Qliro API:', apiError.message);
      console.log('   This is the same error you\'re experiencing in the application');
    }
    
    console.log('\n🎯 Diagnosis complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testQliroConnectivity();
