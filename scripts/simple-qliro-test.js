// Simple test to check basic connectivity
console.log('Testing basic connectivity...');

async function testBasicConnectivity() {
  try {
    // Test 1: Basic fetch to a known endpoint
    console.log('1. Testing basic fetch capability...');
    const response = await fetch('https://httpbin.org/json');
    console.log('✅ Basic fetch works, status:', response.status);
    
    // Test 2: Test HTTPS connectivity
    console.log('2. Testing HTTPS connectivity...');
    const httpsResponse = await fetch('https://api.github.com');
    console.log('✅ HTTPS fetch works, status:', httpsResponse.status);
    
    // Test 3: Try to reach Qliro's likely API endpoint
    console.log('3. Testing Qliro API endpoint...');
    try {
      const qliroResponse = await fetch('https://api.qliro.com/checkout/merchantapi/Orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      console.log('✅ Qliro API endpoint reachable, status:', qliroResponse.status);
    } catch (qliroError) {
      console.log('❌ Cannot reach Qliro API:', qliroError.message);
    }
    
  } catch (error) {
    console.log('❌ Basic connectivity test failed:', error.message);
  }
}

testBasicConnectivity();
