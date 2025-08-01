import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Log to verify env is loaded
console.log('Loading environment from .env.local');
console.log('DATABASE_URL set?', !!process.env.DATABASE_URL);

// Now import database after env is loaded
import { db } from './lib/db';
import { userCredits, lessonTypes } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function testCreditsDatabase() {
console.log('=== Testing Credits Database Operations ===');
  console.log('Database URL:', process.env.DATABASE_URL);
  
  try {
    // Test 1: Fetch all lesson types
    console.log('\n1. Fetching lesson types...');
    const allLessonTypes = await db.select().from(lessonTypes).limit(5);
    console.log('Lesson types found:', allLessonTypes.length);
    if (allLessonTypes.length > 0) {
      console.log('First lesson type:', allLessonTypes[0]);
    }
    
    // Test 2: Fetch all user credits
    console.log('\n2. Fetching all user credits...');
    const allCredits = await db.select().from(userCredits).limit(10);
    console.log('Total credits found:', allCredits.length);
    allCredits.forEach(credit => {
      console.log(`Credit: ${credit.id}, User: ${credit.userId}, Type: ${credit.creditType}, Remaining: ${credit.creditsRemaining}/${credit.creditsTotal}`);
    });
    
    // Test 3: Test insert operation
    console.log('\n3. Testing insert operation...');
    const testUserId = 'd601c43a-599c-4715-8b9a-65fe092c6c11'; // Replace with actual user ID
    const testLessonTypeId = allLessonTypes[0]?.id;
    
    if (testLessonTypeId) {
      console.log('Inserting test credit...');
      const insertResult = await db
        .insert(userCredits)
        .values({
          userId: testUserId,
          lessonTypeId: testLessonTypeId,
          handledarSessionId: null,
          creditType: 'lesson',
          creditsRemaining: 5,
          creditsTotal: 5,
        })
        .returning();
        
      console.log('Insert result:', insertResult);
      
      // Verify the insert
      console.log('\n4. Verifying insert...');
      const verifyCredits = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, testUserId));
      
      console.log('Credits for user after insert:', verifyCredits.length);
      verifyCredits.forEach(credit => {
        console.log(`- ${credit.creditType}: ${credit.creditsRemaining}/${credit.creditsTotal}`);
      });
    } else {
      console.log('No lesson types found to test with.');
    }
    
    // Test 5: Test generic handledar credits
    console.log('\n5. Testing generic handledar credits...');
    const handledarResult = await db
      .insert(userCredits)
      .values({
        userId: testUserId,
        lessonTypeId: null,
        handledarSessionId: null,
        creditType: 'handledar',
        creditsRemaining: 3,
        creditsTotal: 3,
      })
      .returning();
      
    console.log('Handledar insert result:', handledarResult);
    
  } catch (error) {
    console.error('Error during database test:', error);
  }
  
  process.exit(0);
}

testCreditsDatabase();
