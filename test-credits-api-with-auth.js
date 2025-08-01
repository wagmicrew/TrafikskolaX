const API_BASE = 'http://localhost:3000';
const USER_ID = 'd601c43a-599c-4715-8b9a-65fe092c6c11';

// Admin credentials - you'll need to update these with actual admin credentials
const ADMIN_EMAIL = 'admin@test.se';
const ADMIN_PASSWORD = 'password123'; // Password has been reset

let authToken = '';

async function loginAsAdmin() {
  console.log('Logging in as admin...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      authToken = data.token;
      console.log('Login successful!');
      console.log('User role:', data.user.role);
      return true;
    } else {
      console.error('Login failed:', data);
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

async function testCreditsAPI() {
  console.log('=== Testing Credits API with Authentication ===\n');
  
  // First, login
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log('Failed to login. Please check admin credentials.');
    return;
  }

  try {
    // Set up headers with auth token
    const authHeaders = {
      'Content-Type': 'application/json',
      'Cookie': `auth-token=${authToken}`
    };

    // First, let's get lesson types to have a valid ID
    console.log('\n1. Fetching lesson types...');
    const lessonTypesResponse = await fetch(`${API_BASE}/api/lesson-types`);
    const lessonTypesData = await lessonTypesResponse.json();
    console.log('Lesson types response:', lessonTypesData);
    
    const lessonTypes = lessonTypesData.lessonTypes || [];
    const firstLessonType = lessonTypes[0];
    
    if (!firstLessonType) {
      console.log('No lesson types found!');
      return;
    }
    
    console.log('Using lesson type:', firstLessonType.name, firstLessonType.id);
    
    // Test 2: Get current credits
    console.log('\n2. Getting current credits...');
    const creditsResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      headers: authHeaders
    });
    const creditsData = await creditsResponse.json();
    console.log('Current credits:', creditsData);
    
    // Test 3: Add lesson credits
    console.log('\n3. Adding lesson credits...');
    const addLessonResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        creditType: 'lesson',
        lessonTypeId: firstLessonType.id,
        amount: 5
      })
    });
    
    const addLessonResult = await addLessonResponse.json();
    console.log('Add lesson credits response:', addLessonResult);
    
    // Test 4: Add generic handledar credits
    console.log('\n4. Adding generic handledar credits...');
    const addHandledarResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        creditType: 'handledar',
        amount: 3
      })
    });
    
    const addHandledarResult = await addHandledarResponse.json();
    console.log('Add handledar credits response:', addHandledarResult);
    
    // Test 5: Verify credits were added
    console.log('\n5. Verifying credits after additions...');
    const verifyResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      headers: authHeaders
    });
    const verifyData = await verifyResponse.json();
    console.log('Credits after additions:', verifyData);
    
  } catch (error) {
    console.error('Error during API test:', error);
  }
}

// Run the test
testCreditsAPI();
