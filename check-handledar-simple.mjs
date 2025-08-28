import { db } from './lib/db/index.js';
import { teoriLessonTypes, teoriSessions } from './lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

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
      
      // Check sessions for handledar types
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
    } else {
      console.log('\n❌ No handledar lesson types found!');
      console.log('This explains why handledarutbildningar are not showing in the booking flow.');
      
      console.log('\nAll lesson types:');
      allTypes.forEach(type => {
        console.log(`- ${type.name} (allowsSupervisors: ${type.allowsSupervisors}, Active: ${type.isActive})`);
      });
    }
    
    console.log('\n=== Check Complete ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkHandledarData();
