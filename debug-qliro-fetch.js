// Debug script to test Qliro fetch specifically
async function debugQliroFetch() {
  console.log('=== Qliro Fetch Debug ===\n');

  // Test 1: Basic fetch availability
  console.log('1. Testing fetch availability...');
  if (typeof fetch === 'undefined') {
    console.log('✗ fetch is not available globally');
    try {
      const { fetch: nodeFetch } = await import('node-fetch');
      global.fetch = nodeFetch;
      console.log('✓ Imported node-fetch as fallback');
    } catch (error) {
      console.log('✗ Could not import node-fetch:', error.message);
      return;
    }
  } else {
    console.log('✓ fetch is available');
  }

  // Test 2: Simple HTTP request
  console.log('\n2. Testing basic HTTP request...');
  try {
    const response = await fetch('https://httpbin.org/json');
    const data = await response.json();
    console.log('✓ Basic HTTP request successful');
  } catch (error) {
    console.log('✗ Basic HTTP request failed:', error.message);
    console.log('Error type:', error.constructor.name);
    console.log('Error cause:', error.cause);
  }

  // Test 3: HTTPS request to a payment-like endpoint
  console.log('\n3. Testing HTTPS request to payment-like endpoint...');
  try {
    const response = await fetch('https://api.stripe.com/v1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrafikskolaX-Debug/1.0'
      }
    });
    console.log('✓ HTTPS payment endpoint reachable, status:', response.status);
  } catch (error) {
    console.log('✗ HTTPS payment endpoint failed:', error.message);
  }

  // Test 4: POST request with JSON body
  console.log('\n4. Testing POST request with JSON body...');
  try {
    const testBody = JSON.stringify({ test: 'data', timestamp: Date.now() });
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: testBody
    });
    const result = await response.json();
    console.log('✓ POST with JSON body successful');
  } catch (error) {
    console.log('✗ POST with JSON body failed:', error.message);
  }

  // Test 5: Simulated Qliro-like request
  console.log('\n5. Testing Qliro-like request structure...');
  try {
    const qliroLikeBody = JSON.stringify({
      MerchantReference: 'TEST-' + Date.now(),
      Currency: 'SEK',
      TotalPrice: 50000,
      OrderItems: [{
        ProductId: 'test-product',
        ProductName: 'Test Product',
        Quantity: 1,
        PricePerItem: 50000,
        VatRate: 0.25
      }],
      Customer: {
        Email: 'test@example.com'
      },
      Gui: {
        ColorScheme: 'white',
        Locale: 'sv-SE'
      },
      Urls: {
        Success: 'https://example.com/success',
        Cancel: 'https://example.com/cancel',
        Notification: 'https://example.com/notification'
      }
    });

    // Test against httpbin to simulate the request structure
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer test-key',
        'User-Agent': 'TrafikskolaX/1.0'
      },
      body: qliroLikeBody
    });

    if (response.ok) {
      console.log('✓ Qliro-like request structure works');
    } else {
      console.log('? Qliro-like request got status:', response.status);
    }
  } catch (error) {
    console.log('✗ Qliro-like request failed:', error.message);
    console.log('Full error:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }

  // Test 6: Network timeout simulation
  console.log('\n6. Testing network timeout handling...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://httpbin.org/delay/2', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('✓ Network timeout handling works');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('✓ Timeout handling works (request was aborted)');
    } else {
      console.log('? Unexpected timeout error:', error.message);
    }
  }

  console.log('\n=== Debug Complete ===');
}

// Run the debug
debugQliroFetch().catch(error => {
  console.error('Debug script failed:', error);
});
