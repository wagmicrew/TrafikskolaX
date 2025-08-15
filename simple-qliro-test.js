// Simple test to check basic connectivity and settings
async function simpleQliroTest() {
  console.log('=== Simple Qliro Test ===\n');

  // Test 1: Check if fetch is available
  console.log('1. Testing fetch availability...');
  if (typeof fetch === 'undefined') {
    console.log('   ❌ fetch is not available globally');
    console.log('   This might be the root cause of the "fetch failed" error');
    
    // Try to use node-fetch as fallback
    try {
      const nodeFetch = require('node-fetch');
      global.fetch = nodeFetch;
      console.log('   ✅ Using node-fetch as fallback');
    } catch (error) {
      console.log('   ❌ node-fetch not available either');
      return;
    }
  } else {
    console.log('   ✅ fetch is available');
  }

  // Test 2: Test basic HTTP request
  console.log('\n2. Testing basic HTTP request...');
  try {
    const response = await fetch('https://httpbin.org/json', {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      console.log('   ✅ Basic HTTP request successful');
    } else {
      console.log(`   ⚠️  HTTP request returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ Basic HTTP request failed:', error.message);
    console.log('   Error type:', error.constructor.name);
    
    if (error.code) {
      console.log('   Error code:', error.code);
    }
    
    return;
  }

  // Test 3: Test HTTPS POST request (similar to Qliro API)
  console.log('\n3. Testing HTTPS POST request...');
  try {
    const testPayload = JSON.stringify({
      test: 'data',
      timestamp: Date.now()
    });

    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TrafikskolaX/1.0'
      },
      body: testPayload,
      timeout: 10000
    });

    if (response.ok) {
      console.log('   ✅ HTTPS POST request successful');
      const data = await response.json();
      console.log('   Response received and parsed successfully');
    } else {
      console.log(`   ⚠️  POST request returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ HTTPS POST request failed:', error.message);
    return;
  }

  // Test 4: Test Qliro API endpoint accessibility (without auth)
  console.log('\n4. Testing Qliro API endpoint accessibility...');
  try {
    const qliroApiUrl = 'https://api.qliro.com/v1/orders';
    const response = await fetch(qliroApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'TrafikskolaX/1.0'
      },
      timeout: 10000
    });

    console.log(`   Response status: ${response.status}`);
    console.log(`   Response status text: ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('   ✅ Qliro API is reachable (401 expected without auth)');
    } else if (response.status === 404) {
      console.log('   ⚠️  Endpoint not found - might need to check API URL');
    } else {
      console.log('   ⚠️  Unexpected response status');
    }
  } catch (error) {
    console.log('   ❌ Qliro API unreachable:', error.message);
    console.log('   This could indicate network issues or firewall blocking');
  }

  // Test 5: Environment check
  console.log('\n5. Environment information...');
  console.log(`   Node.js version: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Architecture: ${process.arch}`);
  console.log(`   Available fetch: ${typeof fetch !== 'undefined' ? 'Yes' : 'No'}`);
  console.log(`   Available crypto: ${typeof require('crypto') !== 'undefined' ? 'Yes' : 'No'}`);

  console.log('\n=== Test Complete ===');
  console.log('If all tests pass, the fetch error might be related to:');
  console.log('- Qliro API credentials or settings');
  console.log('- Network connectivity to Qliro servers');
  console.log('- Request timeout or payload issues');
}

// Run the test
simpleQliroTest().catch(console.error);
