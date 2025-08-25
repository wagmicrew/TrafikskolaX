const { db } = require('../lib/db');
const { sql } = require('drizzle-orm');

async function populateTeoriData() {
  try {
    console.log('🌱 Populating Teori lesson types...');

    // Insert sample Teori lesson types
    const lessonTypes = [
      {
        name: 'Risktväan Teori',
        description: 'Teorilektion för risktvåan - endast studenter',
        allows_supervisors: false,
        price: 500.00,
        price_per_supervisor: null,
        duration_minutes: 60,
        max_participants: 1,
        is_active: true,
        sort_order: 1
      },
      {
        name: 'Grundkurs Teori',
        description: 'Grundläggande teorilektion för studenter',
        allows_supervisors: false,
        price: 500.00,
        price_per_supervisor: null,
        duration_minutes: 60,
        max_participants: 1,
        is_active: true,
        sort_order: 2
      },
      {
        name: 'Avancerad Teori',
        description: 'Avancerad teorilektion med möjlighet för handledare',
        allows_supervisors: true,
        price: 600.00,
        price_per_supervisor: 400.00,
        duration_minutes: 90,
        max_participants: 1,
        is_active: true,
        sort_order: 3
      },
      {
        name: 'Handledar Teori',
        description: 'Teorilektion med obligatorisk handledare/supervisor',
        allows_supervisors: true,
        price: 700.00,
        price_per_supervisor: 500.00,
        duration_minutes: 90,
        max_participants: 1,
        is_active: true,
        sort_order: 4
      }
    ];

    for (const lessonType of lessonTypes) {
      await db.execute(sql`
        INSERT INTO teori_lesson_types (
          name, description, allows_supervisors, price, price_per_supervisor,
          duration_minutes, max_participants, is_active, sort_order
        ) VALUES (
          ${lessonType.name}, ${lessonType.description}, ${lessonType.allows_supervisors},
          ${lessonType.price}, ${lessonType.price_per_supervisor}, ${lessonType.duration_minutes},
          ${lessonType.max_participants}, ${lessonType.is_active}, ${lessonType.sort_order}
        ) ON CONFLICT DO NOTHING
      `);
    }

    console.log('✅ Teori lesson types populated successfully!');

    // Insert sample Teori sessions (next week)
    console.log('📅 Creating sample Teori sessions...');

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const sessions = [
      {
        lesson_type_id: 1, // Risktväan Teori
        title: 'Risktväan Teori - Måndag',
        description: 'Grundläggande riskutbildning',
        date: nextWeek.toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        max_participants: 1,
        is_active: true
      },
      {
        lesson_type_id: 2, // Grundkurs Teori
        title: 'Grundkurs Teori - Tisdag',
        description: 'Grundläggande teorilektion',
        date: new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +1 day
        start_time: '10:00',
        end_time: '11:00',
        max_participants: 1,
        is_active: true
      },
      {
        lesson_type_id: 3, // Avancerad Teori
        title: 'Avancerad Teori - Onsdag',
        description: 'Avancerad teorilektion med handledarmöjlighet',
        date: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +2 days
        start_time: '14:00',
        end_time: '16:00',
        max_participants: 1,
        is_active: true
      },
      {
        lesson_type_id: 4, // Handledar Teori
        title: 'Handledar Teori - Fredag',
        description: 'Teorilektion med obligatorisk handledare',
        date: new Date(nextWeek.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +4 days
        start_time: '13:00',
        end_time: '15:00',
        max_participants: 1,
        is_active: true
      }
    ];

    for (const session of sessions) {
      await db.execute(sql`
        INSERT INTO teori_sessions (
          lesson_type_id, title, description, date, start_time, end_time,
          max_participants, current_participants, is_active
        ) VALUES (
          ${session.lesson_type_id}, ${session.title}, ${session.description},
          ${session.date}, ${session.start_time}, ${session.end_time},
          ${session.max_participants}, 0, ${session.is_active}
        ) ON CONFLICT DO NOTHING
      `);
    }

    console.log('✅ Sample Teori sessions created successfully!');
    console.log('🎯 Teori system is now ready for booking!');

  } catch (error) {
    console.error('❌ Error populating Teori data:', error);
    process.exit(1);
  }
}

populateTeoriData();
