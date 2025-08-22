const fetch = require('node-fetch');

async function testLoginFix() {
  console.log('🧪 Testing login route TypeScript fix...\n');

  try {
    // Test 1: Invalid credentials (should return 401)
    console.log('Test 1: Invalid credentials');
    const response1 = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
    });

    console.log(`Status: ${response1.status}`);
    if (response1.status === 401) {
      console.log('✅ Correctly returns 401 for invalid credentials');
    } else {
      console.log('❌ Expected 401, got:', response1.status);
    }

    // Test 2: Invalid request format (should return 400)
    console.log('\nTest 2: Invalid request format');
    const response2 = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '', // Empty email
        password: 'test'
      })
    });

    console.log(`Status: ${response2.status}`);
    if (response2.status === 400) {
      console.log('✅ Correctly returns 400 for validation error');
    } else {
      console.log('❌ Expected 400, got:', response2.status);
    }

    // Test 3: Rate limiting (should return 429 after multiple attempts)
    console.log('\nTest 3: Rate limiting test');
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'test'
        })
      }));
    }

    const responses = await Promise.all(promises);
    const rateLimitedResponse = responses.find(r => r.status === 429);

    if (rateLimitedResponse) {
      console.log('✅ Rate limiting is working (got 429)');
    } else {
      console.log('⚠️  Rate limiting may not be working as expected');
    }

    console.log('\n🎉 Login route TypeScript fix verification complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLoginFix();
