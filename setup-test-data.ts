import { db } from './lib/db';
import { lessonTypes } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function setupTestData() {
  try {
    // Check if we have any lesson types
    const existingTypes = await db.select().from(lessonTypes).limit(1);
    
    if (existingTypes.length === 0) {
      // Create a test lesson type
      const [newType] = await db.insert(lessonTypes).values({
        name: 'B-körkort 40 min',
        description: 'Standard körlektion för B-körkort',
        price: 500,
        priceStudent: 450,
        durationMinutes: 40,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),

      }).returning();
      
      console.log('Created test lesson type:', newType);
    } else {
      console.log('Using existing lesson type:', existingTypes[0]);
    }
    
    // Get the first lesson type
    const [lessonType] = await db.select().from(lessonTypes).limit(1);
    console.log('\nUse this ID in your tests:', lessonType.id);
    
  } catch (error) {
    console.error('Error setting up test data:', error);
  } finally {
    process.exit();
  }
}

setupTestData();
