const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function populateSessionTypes() {
  try {
    console.log('Populating default session types...');

    const sql = neon(process.env.DATABASE_URL);

    // Check if session_types table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'session_types'
      )
    `;

    if (!tableExists[0].exists) {
      console.log('Creating session_types table...');

      await sql`
        CREATE TABLE session_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL,
          credit_type VARCHAR(50) NOT NULL,
          base_price DECIMAL(10,2) NOT NULL,
          price_per_supervisor DECIMAL(10,2),
          duration_minutes INTEGER NOT NULL DEFAULT 60,
          max_participants INTEGER NOT NULL DEFAULT 1,
          allows_supervisors BOOLEAN DEFAULT false,
          requires_personal_id BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      console.log('Session types table created');
    }

    // Check if sessions table exists
    const sessionsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'sessions'
      )
    `;

    if (!sessionsTableExists[0].exists) {
      console.log('Creating sessions table...');

      await sql`
        CREATE TABLE sessions (
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
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      console.log('Sessions table created');
    }

    // Check if session_bookings table exists
    const bookingsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'session_bookings'
      )
    `;

    if (!bookingsTableExists[0].exists) {
      console.log('Creating session_bookings table...');

      await sql`
        CREATE TABLE session_bookings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
          student_id UUID REFERENCES users(id),
          supervisor_name VARCHAR(255),
          supervisor_email VARCHAR(255),
          supervisor_phone VARCHAR(50),
          supervisor_personal_number TEXT,
          supervisor_count INTEGER DEFAULT 1,
          status VARCHAR(50) DEFAULT 'pending',
          price DECIMAL(10,2) NOT NULL,
          base_price DECIMAL(10,2),
          price_per_supervisor DECIMAL(10,2),
          payment_status VARCHAR(50) DEFAULT 'pending',
          payment_method VARCHAR(50),
          swish_uuid VARCHAR(255),
          booked_by UUID REFERENCES users(id),
          reminder_sent BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      console.log('Session bookings table created');
    }

    // Insert default session types
    const defaultSessionTypes = [
      {
        name: 'Handledarutbildning',
        description: 'Grundläggande utbildning för handledare',
        type: 'handledarutbildning',
        credit_type: 'handledarutbildning',
        base_price: 500.00,
        price_per_supervisor: 500.00,
        duration_minutes: 120,
        max_participants: 2,
        allows_supervisors: true,
        requires_personal_id: true,
        sort_order: 1
      },
      {
        name: 'Riskettan Teori',
        description: 'Teoretisk utbildning för riskettan',
        type: 'teorilektion',
        credit_type: 'riskettan',
        base_price: 500.00,
        duration_minutes: 60,
        max_participants: 1,
        allows_supervisors: false,
        requires_personal_id: false,
        sort_order: 2
      },
      {
        name: 'Riskettan Praktik',
        description: 'Praktisk utbildning för riskettan',
        type: 'handledarkurs',
        credit_type: 'riskettan',
        base_price: 800.00,
        price_per_supervisor: 800.00,
        duration_minutes: 180,
        max_participants: 1,
        allows_supervisors: true,
        requires_personal_id: true,
        sort_order: 3
      },
      {
        name: 'Körlektion B',
        description: 'Standard körlektion kategori B',
        type: 'teorilektion',
        credit_type: 'korlektion',
        base_price: 600.00,
        duration_minutes: 60,
        max_participants: 1,
        allows_supervisors: false,
        requires_personal_id: false,
        sort_order: 4
      }
    ];

    for (const sessionType of defaultSessionTypes) {
      // Check if it already exists
      const existing = await sql`
        SELECT id FROM session_types WHERE name = ${sessionType.name} LIMIT 1
      `;

      if (existing.length === 0) {
        await sql`
          INSERT INTO session_types (
            name, description, type, credit_type, base_price, price_per_supervisor,
            duration_minutes, max_participants, allows_supervisors, requires_personal_id, sort_order
          ) VALUES (
            ${sessionType.name}, ${sessionType.description}, ${sessionType.type},
            ${sessionType.credit_type}, ${sessionType.base_price}, ${sessionType.price_per_supervisor},
            ${sessionType.duration_minutes}, ${sessionType.max_participants},
            ${sessionType.allows_supervisors}, ${sessionType.requires_personal_id}, ${sessionType.sort_order}
          )
        `;
        console.log(`Created session type: ${sessionType.name}`);
      } else {
        console.log(`Session type already exists: ${sessionType.name}`);
      }
    }

    console.log('Default session types populated successfully!');

  } catch (error) {
    console.error('Error populating session types:', error);
  }
}

populateSessionTypes();
