const API_BASE = 'http://localhost:3000';
const USER_ID = 'd601c43a-599c-4715-8b9a-65fe092c6c11';

async function testCreditsAPI() {
  console.log('=== Testing Credits API ===');
  
  try {
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
    const creditsResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`);
    const creditsData = await creditsResponse.json();
    console.log('Current credits:', creditsData);
    
    // Test 3: Add lesson credits
    console.log('\n3. Adding lesson credits...');
    const addLessonResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creditType: 'handledar',
        amount: 3
      })
    });
    
    const addHandledarResult = await addHandledarResponse.json();
    console.log('Add handledar credits response:', addHandledarResult);
    
    // Test 5: Verify credits were added
    console.log('\n5. Verifying credits after additions...');
    const verifyResponse = await fetch(`${API_BASE}/api/admin/users/${USER_ID}/credits`);
    const verifyData = await verifyResponse.json();
    console.log('Credits after additions:', verifyData);
    
  } catch (error) {
    console.error('Error during API test:', error);
  }
}

// Run the test
testCreditsAPI();
