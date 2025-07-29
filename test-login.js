// Test login functionality
const fetch = require('node-fetch');

const BASE_URL = 'https://dev.dintrafikskolahlm.se';

async function testLogin(email, password, expectedRole) {
  console.log(`\n🧪 Testing login for ${email} (${expectedRole})...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log(`✅ Login successful for ${email}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   Name: ${data.user.firstName} ${data.user.lastName}`);
      console.log(`   Redirect URL: ${data.redirectUrl}`);
      console.log(`   Token: ${data.token.substring(0, 20)}...`);
      
      // Test token verification
      const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyResponse.ok && verifyData.success) {
        console.log(`✅ Token verification successful`);
        console.log(`   Verified user: ${verifyData.user.email} (${verifyData.user.role})`);
      } else {
        console.log(`❌ Token verification failed:`, verifyData.error);
      }
      
    } else {
      console.log(`❌ Login failed for ${email}:`, data.error);
    }
  } catch (error) {
    console.log(`❌ Error testing login for ${email}:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Testing login functionality...');
  
  // Test all user types
  await testLogin('admin@test.se', 'password123', 'admin');
  await testLogin('teacher@test.se', 'password123', 'teacher');
  await testLogin('student@test.se', 'password123', 'student');
  
  // Test invalid credentials
  await testLogin('invalid@test.se', 'wrongpassword', 'none');
  
  console.log('\n✅ All tests completed!');
}

runTests();
