const { db } = require('./lib/db');
const { teoriSessions, teoriLessonTypes } = require('./lib/db/schema');
const { eq, and } = require('drizzle-orm');

async function debugHandledarSessions() {
  try {
    console.log('=== Debugging Handledar Sessions ===\n');
    
    // 1. Check all lesson types
    console.log('1. All teori lesson types:');
    const allTypes = await db.select().from(teoriLessonTypes);
    allTypes.forEach(type => {
      console.log(`   - ${type.name} (allowsSupervisors: ${type.allowsSupervisors})`);
    });
    console.log(`   Total: ${allTypes.length} types\n`);
    
    // 2. Check handledar types specifically
    console.log('2. Handledar lesson types (allowsSupervisors=true):');
    const handledarTypes = await db
      .select()
      .from(teoriLessonTypes)
      .where(eq(teoriLessonTypes.allowsSupervisors, true));
    
    if (handledarTypes.length === 0) {
      console.log('   ❌ NO HANDLEDAR TYPES FOUND!');
      console.log('   This is why no sessions are showing up.\n');
    } else {
      handledarTypes.forEach(type => {
        console.log(`   ✅ ${type.name} (ID: ${type.id})`);
      });
      console.log(`   Total: ${handledarTypes.length} handledar types\n`);
    }
    
    // 3. Check all sessions
    console.log('3. All teori sessions:');
    const allSessions = await db.select().from(teoriSessions);
    console.log(`   Total sessions: ${allSessions.length}\n`);
    
    // 4. Check sessions for handledar types
    if (handledarTypes.length > 0) {
      console.log('4. Sessions for handledar types:');
      for (const type of handledarTypes) {
        const sessions = await db
          .select()
          .from(teoriSessions)
          .where(eq(teoriSessions.lessonTypeId, type.id));
        
        console.log(`   ${type.name}: ${sessions.length} sessions`);
        sessions.forEach(session => {
          console.log(`     - ${session.title} on ${session.date} (active: ${session.isActive})`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugHandledarSessions();
