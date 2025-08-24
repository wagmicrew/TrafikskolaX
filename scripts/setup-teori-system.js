const { db } = require('../lib/db');
const { sql } = require('drizzle-orm');

async function setupTeoriSystem() {
  try {
    console.log('🚀 Setting up Teori lesson system...');

    // Create teori_lesson_types table
    console.log('📚 Creating teori_lesson_types table...');
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS teori_lesson_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        allows_supervisors BOOLEAN DEFAULT FALSE,
        price DECIMAL(10, 2) NOT NULL,
        price_per_supervisor DECIMAL(10, 2),
        duration_minutes INTEGER DEFAULT 60,
        max_participants INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `));

    // Create teori_sessions table
    console.log('📅 Creating teori_sessions table...');
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS teori_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_type_id UUID NOT NULL REFERENCES teori_lesson_types(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        max_participants INTEGER DEFAULT 1,
        current_participants INTEGER DEFAULT 0,
        teacher_id UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `));

    // Create teori_bookings table
    console.log('📝 Creating teori_bookings table...');
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS teori_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES teori_sessions(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        price DECIMAL(10, 2) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        swish_uuid VARCHAR(255),
        booked_by UUID REFERENCES users(id),
        reminder_sent BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `));

    // Create teori_supervisors table
    console.log('👨‍🏫 Creating teori_supervisors table...');
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS teori_supervisors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teori_booking_id UUID NOT NULL REFERENCES teori_bookings(id) ON DELETE CASCADE,
        supervisor_name VARCHAR(255) NOT NULL,
        supervisor_email VARCHAR(255),
        supervisor_phone VARCHAR(50),
        supervisor_personal_number VARCHAR(20),
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `));

    // Create indexes
    console.log('🔍 Creating indexes...');
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_teori_lesson_types_is_active ON teori_lesson_types(is_active);`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_teori_lesson_types_sort_order ON teori_lesson_types(sort_order);`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_teori_sessions_lesson_type_id ON teori_sessions(lesson_type_id);`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_teori_sessions_date ON teori_sessions(date);`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_teori_sessions_teacher_id ON teori_sessions(teacher_id);`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_teori_bookings_session_id ON teori_bookings(session_id);`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_teori_bookings_student_id ON teori_bookings(student_id);`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_teori_bookings_status ON teori_bookings(status);`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_teori_supervisors_booking_id ON teori_supervisors(teori_booking_id);`));

    // Insert sample lesson types
    console.log('📚 Inserting sample Teori lesson types...');
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

    // Create sample sessions for next week
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

    console.log('✅ Teori system setup completed successfully!');
    console.log('🎯 Available Teori lesson types:');
    console.log('   1. Risktväan Teori (500 kr)');
    console.log('   2. Grundkurs Teori (500 kr)');
    console.log('   3. Avancerad Teori (600 kr + 400 kr/supervisor)');
    console.log('   4. Handledar Teori (700 kr + 500 kr/supervisor)');
    console.log('');
    console.log('📅 Sample sessions created for next week');
    console.log('🚀 Teori booking system is now ready!');

  } catch (error) {
    console.error('❌ Error setting up Teori system:', error);
    process.exit(1);
  }
}

setupTeoriSystem();
