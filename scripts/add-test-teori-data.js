const { db } = require('../lib/db');
const { teoriSessions, teoriLessonTypes } = require('../lib/db/schema');
const { eq, and } = require('drizzle-orm');

async function addTestTeoriData() {
  try {
    console.log('Adding test teori data...');

    // First, add some teori lesson types
    const lessonTypes = [
      {
        name: 'Risktvåan - Teorilektion',
        description: 'Risktvåan teorilektion för studenter',
        price: '150.00',
        priceStudent: '120.00',
        durationMinutes: 45,
        isActive: true,
        allowsSupervisors: false,
        maxParticipants: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Teorilektion - Körkort',
        description: 'Allmän teorilektion för körkort',
        price: '200.00',
        priceStudent: '180.00',
        durationMinutes: 60,
        isActive: true,
        allowsSupervisors: true,
        pricePerSupervisor: '50.00',
        maxParticipants: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    for (const lessonType of lessonTypes) {
      const existing = await db.select().from(teoriLessonTypes).where(eq(teoriLessonTypes.name, lessonType.name));
      if (existing.length === 0) {
        const [newType] = await db.insert(teoriLessonTypes).values(lessonType).returning();
        console.log('Created teori lesson type:', newType.name);
      } else {
        console.log('Teori lesson type already exists:', lessonType.name);
      }
    }

    // Get the lesson types we just created
    const allLessonTypes = await db.select().from(teoriLessonTypes).limit(2);

    if (allLessonTypes.length === 0) {
      console.log('No lesson types found, skipping session creation');
      return;
    }

    // Add some test sessions for the next few weeks
    const sessions = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) { // Next 2 weeks
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() + i);

      // Skip weekends
      if (sessionDate.getDay() === 0 || sessionDate.getDay() === 6) continue;

      // Add 2 sessions per day
      for (let j = 0; j < 2; j++) {
        const lessonType = allLessonTypes[j % allLessonTypes.length];
        const startHour = j === 0 ? 10 : 14; // 10 AM and 2 PM

        sessions.push({
          lessonTypeId: lessonType.id,
          title: `${lessonType.name} - ${sessionDate.toLocaleDateString('sv-SE')}`,
          description: `Reguljär ${lessonType.name.toLowerCase()}`,
          date: sessionDate.toISOString().split('T')[0],
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${(startHour + Math.floor(lessonType.durationMinutes / 60)).toString().padStart(2, '0')}:${(lessonType.durationMinutes % 60).toString().padStart(2, '0')}`,
          maxParticipants: lessonType.maxParticipants || 8,
          currentParticipants: Math.floor(Math.random() * 4), // 0-3 random participants
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    for (const session of sessions) {
      const existing = await db.select()
        .from(teoriSessions)
        .where(and(
          eq(teoriSessions.date, session.date),
          eq(teoriSessions.startTime, session.startTime),
          eq(teoriSessions.lessonTypeId, session.lessonTypeId)
        ));

      if (existing.length === 0) {
        const [newSession] = await db.insert(teoriSessions).values(session).returning();
        console.log('Created teori session:', newSession.title);
      }
    }

    console.log('Test teori data added successfully!');
    console.log(`Created ${sessions.length} teori sessions across ${Math.ceil(sessions.length / 2)} days`);

  } catch (error) {
    console.error('Error adding test teori data:', error);
  } finally {
    process.exit(0);
  }
}

addTestTeoriData();
