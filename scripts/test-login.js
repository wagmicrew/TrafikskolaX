import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Testing login functionality...');

    // Use a unique email to avoid conflicts
    const uniqueEmail = `test${Date.now()}@example.com`;

    // First, try to register a test user
    console.log('Registering user:', uniqueEmail);
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'test123',
        firstName: 'Test',
        lastName: 'User'
      })
    });

    console.log('Register response status:', registerResponse.status);

    if (registerResponse.status === 200) {
      console.log('User registered successfully');
      const registerData = await registerResponse.json();
      console.log('Register data:', registerData);
    } else {
      const errorText = await registerResponse.text();
      console.log('Register failed:', errorText);
      return; // Don't try to login if register failed
    }

    // Now try to login
    console.log('Attempting login for:', uniqueEmail);
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'test123'
      })
    });

    console.log('Login response status:', loginResponse.status);

    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log('Login successful:', loginData);
    } else {
      const errorText = await loginResponse.text();
      console.log('Login failed with status', loginResponse.status);
      console.log('Error response:', errorText);

      // Try to get more detailed error info
      const errorHeaders = {};
      for (const [key, value] of loginResponse.headers.entries()) {
        errorHeaders[key] = value;
      }
      console.log('Error headers:', errorHeaders);
    }

  } catch (error) {
    console.error('Network or other error:', error);
  }
}

testLogin();
