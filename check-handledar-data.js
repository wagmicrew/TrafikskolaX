const { db } = require('./lib/db');
const { teoriLessonTypes, teoriSessions } = require('./lib/db/schema');
const { eq } = require('drizzle-orm');

async function checkHandledarData() {
  try {
    console.log('=== Checking Handledar Data ===');
    
    // Check lesson types
    console.log('\n1. Checking teori_lesson_types...');
    const allTypes = await db.select().from(teoriLessonTypes);
    console.log(`Found ${allTypes.length} lesson types total`);
    
    const handledarTypes = allTypes.filter(t => t.allowsSupervisors);
    console.log(`Found ${handledarTypes.length} handledar types (allowsSupervisors=true)`);
    
    if (handledarTypes.length > 0) {
      console.log('Handledar lesson types:');
      handledarTypes.forEach(type => {
        console.log(`- ${type.name} (ID: ${type.id}, Active: ${type.isActive})`);
      });
    }
    
    // Check sessions for handledar types
    if (handledarTypes.length > 0) {
      console.log('\n2. Checking teori_sessions for handledar types...');
      for (const type of handledarTypes) {
        const sessions = await db.select().from(teoriSessions).where(eq(teoriSessions.lessonTypeId, type.id));
        console.log(`- ${type.name}: ${sessions.length} sessions`);
        if (sessions.length > 0) {
          sessions.forEach(session => {
            console.log(`  * ${session.title} on ${session.date} (Active: ${session.isActive})`);
          });
        }
      }
    }
    
    // If no handledar types exist, create one
    if (handledarTypes.length === 0) {
      console.log('\n3. Creating sample handledar lesson type...');
      const newType = await db.insert(teoriLessonTypes).values({
        name: 'Handledarutbildning',
        description: 'Utbildning för handledare',
        allowsSupervisors: true,
        price: '500.00',
        pricePerSupervisor: '500.00',
        durationMinutes: 120,
        maxParticipants: 10,
        isActive: true,
        sortOrder: 1
      }).returning();
      
      console.log('Created handledar lesson type:', newType[0]);
      
      // Create a sample session
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const newSession = await db.insert(teoriSessions).values({
        lessonTypeId: newType[0].id,
        title: 'Handledarutbildning - Test Session',
        description: 'Test session for handledar training',
        date: dateStr,
        startTime: '10:00',
        endTime: '12:00',
        maxParticipants: 10,
        currentParticipants: 0,
        sessionType: 'handledar',
        price: '500.00',
        isActive: true
      }).returning();
      
      console.log('Created test session:', newSession[0]);
    }
    
    console.log('\n=== Check Complete ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkHandledarData();
