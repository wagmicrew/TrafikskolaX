import { db } from './lib/db/index.js';
import { teoriSessions, teoriLessonTypes } from './lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

async function createHandledarTestData() {
  try {
    console.log('=== Creating Handledar Test Data ===\n');
    
    // 1. Check if handledar lesson type exists
    const existingHandledar = await db
      .select()
      .from(teoriLessonTypes)
      .where(eq(teoriLessonTypes.name, 'Handledarutbildning'));
    
    let handledarTypeId;
    
    if (existingHandledar.length === 0) {
      console.log('Creating Handledarutbildning lesson type...');
      const [newType] = await db.insert(teoriLessonTypes).values({
        name: 'Handledarutbildning',
        description: 'Utbildning för handledare av körkortsaspiranter',
        allowsSupervisors: true,
        price: 1500.00,
        pricePerSupervisor: 200.00,
        durationMinutes: 480, // 8 hours
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      handledarTypeId = newType.id;
      console.log(`✅ Created handledar lesson type with ID: ${handledarTypeId}`);
    } else {
      handledarTypeId = existingHandledar[0].id;
      console.log(`✅ Handledar lesson type already exists with ID: ${handledarTypeId}`);
    }
    
    // 2. Create some test sessions
    const today = new Date();
    const sessions = [
      {
        title: 'Handledarutbildning - Grundkurs',
        description: 'Grundläggande utbildning för handledare',
        date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
        startTime: '09:00:00',
        endTime: '17:00:00',
        maxParticipants: 12,
        currentParticipants: 3
      },
      {
        title: 'Handledarutbildning - Fördjupning',
        description: 'Fördjupande kurs för erfarna handledare',
        date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // Two weeks
        startTime: '10:00:00',
        endTime: '16:00:00',
        maxParticipants: 8,
        currentParticipants: 1
      },
      {
        title: 'Handledarutbildning - Helgkurs',
        description: 'Intensivkurs över helgen',
        date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // Three weeks
        startTime: '08:30:00',
        endTime: '18:00:00',
        maxParticipants: 15,
        currentParticipants: 8
      }
    ];
    
    console.log('\nCreating test sessions...');
    for (const sessionData of sessions) {
      const [session] = await db.insert(teoriSessions).values({
        lessonTypeId: handledarTypeId,
        title: sessionData.title,
        description: sessionData.description,
        date: sessionData.date.toISOString().split('T')[0],
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        maxParticipants: sessionData.maxParticipants,
        currentParticipants: sessionData.currentParticipants,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log(`✅ Created session: ${session.title} on ${sessionData.date.toDateString()}`);
    }
    
    console.log('\n=== Test Data Created Successfully ===');
    console.log('You should now see handledar sessions in the booking flow!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createHandledarTestData();
