const API_BASE = 'http://localhost:3000';
const USER_ID = 'd601c43a-599c-4715-8b9a-65fe092c6c11';

// Admin credentials
const ADMIN_EMAIL = 'admin@test.se';
const ADMIN_PASSWORD = 'password123';

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

async function testCreditOperations() {
  console.log('=== Testing Credit Addition and Deduction ===\n');
  
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

    // Get lesson types
    console.log('\n1. Fetching lesson types...');
    const lessonTypesResponse = await fetch(`${API_BASE}/api/lesson-types`);
    const lessonTypesData = await lessonTypesResponse.json();
    const firstLessonType = lessonTypesData.lessonTypes[0];
    console.log('Using lesson type:', firstLessonType.name, firstLessonType.id);
    
    // Get current credits
    console.log('\n2. Getting current credits...');
    const creditsResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      headers: authHeaders
    });
    const creditsData = await creditsResponse.json();
    console.log('Current credits:', creditsData.credits);
    
    // Test 3: Add more credits to existing lesson type
    console.log('\n3. Adding 3 more credits to existing lesson type...');
    const addMoreResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        creditType: 'lesson',
        lessonTypeId: firstLessonType.id,
        amount: 3
      })
    });
    
    const addMoreResult = await addMoreResponse.json();
    console.log('Add more credits response:', addMoreResult);
    
    // Test 4: Deduct credits
    console.log('\n4. Deducting 2 credits from lesson type...');
    const deductResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        creditType: 'lesson',
        lessonTypeId: firstLessonType.id,
        amount: -2  // Negative amount for deduction
      })
    });
    
    const deductResult = await deductResponse.json();
    console.log('Deduct credits response:', deductResult);
    
    // Test 5: Try to deduct more than available
    console.log('\n5. Trying to deduct 100 credits (should fail)...');
    const overDeductResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        creditType: 'lesson',
        lessonTypeId: firstLessonType.id,
        amount: -100
      })
    });
    
    const overDeductResult = await overDeductResponse.json();
    console.log('Over-deduct response:', overDeductResult);
    
    // Test 6: Add credits to handledar
    console.log('\n6. Adding 2 more handledar credits...');
    const addHandledarResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        creditType: 'handledar',
        amount: 2
      })
    });
    
    const addHandledarResult = await addHandledarResponse.json();
    console.log('Add handledar credits response:', addHandledarResult);
    
    // Test 7: Deduct handledar credits
    console.log('\n7. Deducting 1 handledar credit...');
    const deductHandledarResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        creditType: 'handledar',
        amount: -1
      })
    });
    
    const deductHandledarResult = await deductHandledarResponse.json();
    console.log('Deduct handledar credits response:', deductHandledarResult);
    
    // Final verification
    console.log('\n8. Final verification of all credits...');
    const finalResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      headers: authHeaders
    });
    const finalData = await finalResponse.json();
    console.log('\nFinal credits state:');
    finalData.credits.forEach(credit => {
      const name = credit.lessonTypeName || credit.handledarSessionTitle;
      console.log(`- ${name}: ${credit.creditsRemaining} remaining (Total: ${credit.creditsTotal})`);
    });
    
  } catch (error) {
    console.error('Error during API test:', error);
  }
}

// Run the test
testCreditOperations();
