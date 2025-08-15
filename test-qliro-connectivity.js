const crypto = require('crypto');

// Test Qliro API connectivity without database dependencies
async function testQliroConnectivity() {
  console.log('Testing Qliro API connectivity...\n');

  // Mock settings for testing (replace with actual values)
  const testSettings = {
    apiKey: 'test-api-key',
    apiSecret: 'test-secret',
    apiUrl: 'https://api.qliro.com/v1',
    environment: 'sandbox'
  };

  console.log('1. Testing basic fetch functionality...');
  try {
    const response = await fetch('https://httpbin.org/get');
    const data = await response.json();
    console.log('✓ Basic fetch works');
  } catch (error) {
    console.log('✗ Basic fetch failed:', error.message);
    return;
  }

  console.log('\n2. Testing Qliro API endpoint accessibility...');
  try {
    // Test if we can reach Qliro API (should get 401 without auth)
    const response = await fetch(`${testSettings.apiUrl}/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrafikskolaX/1.0'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.log('✓ Qliro API is reachable (401 expected without auth)');
    } else {
      console.log('? Unexpected response status');
    }
  } catch (error) {
    console.log('✗ Qliro API unreachable:', error.message);
    console.log('Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause,
      stack: error.stack?.split('\n').slice(0, 3)
    });
  }

  console.log('\n3. Testing authentication header generation...');
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    const method = 'POST';
    const path = '/orders';
    const body = JSON.stringify({ test: 'data' });

    // Generate signature (mock)
    const stringToSign = `${method}|${path}|${testSettings.apiKey}|${timestamp}|${nonce}|${body}`;
    const signature = crypto.createHmac('sha256', testSettings.apiSecret).update(stringToSign).digest('base64');

    console.log('✓ Authentication headers generated successfully');
    console.log('Sample headers:', {
      'Authorization': `Bearer ${testSettings.apiKey}`,
      'X-Qliro-Timestamp': timestamp,
      'X-Qliro-Nonce': nonce,
      'X-Qliro-Signature': signature
    });
  } catch (error) {
    console.log('✗ Auth header generation failed:', error.message);
  }

  console.log('\n4. Testing network configuration...');
  try {
    // Test different endpoints to isolate network issues
    const testUrls = [
      'https://google.com',
      'https://api.github.com',
      'https://httpbin.org/status/200'
    ];

    for (const url of testUrls) {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          timeout: 5000 
        });
        console.log(`✓ ${url}: ${response.status}`);
      } catch (error) {
        console.log(`✗ ${url}: ${error.message}`);
      }
    }
  } catch (error) {
    console.log('Network test failed:', error.message);
  }

  console.log('\n5. Environment check...');
  console.log('Node.js version:', process.version);
  console.log('Platform:', process.platform);
  console.log('Available fetch:', typeof fetch);
  console.log('Available crypto:', typeof crypto);
}

testQliroConnectivity().catch(console.error);
