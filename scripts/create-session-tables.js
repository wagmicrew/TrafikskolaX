const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createSessionTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('📋 Creating session_types and sessions tables...');

    // Create enum types
    console.log('🔧 Creating enum types...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE session_type AS ENUM ('handledarutbildning', 'riskettan', 'teorilektion', 'handledarkurs', 'teori');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE credit_type AS ENUM ('handledarutbildning', 'riskettan', 'teorilektion', 'handledarkurs', 'teori');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create session_types table
    console.log('📚 Creating session_types table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type session_type NOT NULL,
        credit_type credit_type NOT NULL,
        base_price DECIMAL(10, 2) NOT NULL,
        price_per_supervisor DECIMAL(10, 2),
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        max_participants INTEGER NOT NULL DEFAULT 1,
        allows_supervisors BOOLEAN DEFAULT FALSE,
        requires_personal_id BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Create sessions table
    console.log('📅 Creating sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_type_id UUID NOT NULL REFERENCES session_types(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        max_participants INTEGER NOT NULL DEFAULT 1,
        current_participants INTEGER NOT NULL DEFAULT 0,
        teacher_id UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Create session_bookings table
    console.log('📝 Creating session_bookings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id),
        supervisor_name VARCHAR(255),
        supervisor_email VARCHAR(255),
        supervisor_phone VARCHAR(50),
        supervisor_personal_number TEXT,
        supervisor_count INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'pending',
        price DECIMAL(10, 2) NOT NULL,
        base_price DECIMAL(10, 2),
        price_per_supervisor DECIMAL(10, 2),
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        swish_uuid VARCHAR(255),
        booked_by UUID REFERENCES users(id),
        reminder_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Create indexes
    console.log('🔍 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_types_is_active ON session_types(is_active);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_types_sort_order ON session_types(sort_order);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_session_type_id ON sessions(session_type_id);
    `);

    // Insert default session types
    console.log('🌱 Inserting default session types...');
    const defaultSessionTypes = [
      {
        name: 'Handledarutbildning',
        type: 'handledarutbildning',
        credit_type: 'handledarutbildning',
        base_price: 1200.00,
        price_per_supervisor: 600.00,
        duration_minutes: 480,
        max_participants: 10,
        allows_supervisors: true,
        requires_personal_id: true,
        sort_order: 1
      },
      {
        name: 'Riskettan Teori',
        type: 'teori',
        credit_type: 'teori',
        base_price: 800.00,
        duration_minutes: 120,
        max_participants: 15,
        allows_supervisors: false,
        requires_personal_id: false,
        sort_order: 2
      },
      {
        name: 'Teorilektion',
        type: 'teorilektion',
        credit_type: 'teorilektion',
        base_price: 400.00,
        duration_minutes: 60,
        max_participants: 1,
        allows_supervisors: false,
        requires_personal_id: false,
        sort_order: 3
      }
    ];

    for (const sessionType of defaultSessionTypes) {
      await client.query(`
        INSERT INTO session_types (name, type, credit_type, base_price, price_per_supervisor, duration_minutes, max_participants, allows_supervisors, requires_personal_id, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
      `, [
        sessionType.name,
        sessionType.type,
        sessionType.credit_type,
        sessionType.base_price,
        sessionType.price_per_supervisor,
        sessionType.duration_minutes,
        sessionType.max_participants,
        sessionType.allows_supervisors,
        sessionType.requires_personal_id,
        sessionType.sort_order
      ]);
    }

    console.log('✅ Session tables created successfully!');
    console.log('📊 Default session types inserted!');

  } catch (error) {
    console.error('❌ Error creating session tables:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

createSessionTables();
