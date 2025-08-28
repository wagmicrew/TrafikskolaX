const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function createHandledarData() {
  try {
    console.log('Creating handledar lesson types and sessions...');
    
    // Check if handledar lesson types already exist
    const existingTypes = await sql`
      SELECT * FROM teori_lesson_types WHERE allows_supervisors = true
    `;
    
    if (existingTypes.length > 0) {
      console.log('Handledar lesson types already exist:', existingTypes.length);
      existingTypes.forEach(type => {
        console.log(`- ${type.name} (ID: ${type.id})`);
      });
      return;
    }
    
    // Create handledar lesson types
    const handledarTypes = [
      {
        name: 'Handledarutbildning',
        description: 'Utbildning för handledare - grundkurs',
        allows_supervisors: true,
        price: '500.00',
        price_per_supervisor: '500.00',
        duration_minutes: 180,
        max_participants: 12,
        is_active: true,
        sort_order: 1
      },
      {
        name: 'Handledarutbildning - Fördjupning',
        description: 'Fördjupningskurs för handledare',
        allows_supervisors: true,
        price: '400.00',
        price_per_supervisor: '400.00',
        duration_minutes: 120,
        max_participants: 10,
        is_active: true,
        sort_order: 2
      }
    ];
    
    for (const type of handledarTypes) {
      const [newType] = await sql`
        INSERT INTO teori_lesson_types (
          name, description, allows_supervisors, price, price_per_supervisor,
          duration_minutes, max_participants, is_active, sort_order,
          created_at, updated_at
        ) VALUES (
          ${type.name}, ${type.description}, ${type.allows_supervisors},
          ${type.price}, ${type.price_per_supervisor}, ${type.duration_minutes},
          ${type.max_participants}, ${type.is_active}, ${type.sort_order},
          NOW(), NOW()
        ) RETURNING *
      `;
      
      console.log(`Created lesson type: ${newType.name} (ID: ${newType.id})`);
      
      // Create sample sessions for each type
      const sessions = [
        {
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
          start_time: '09:00',
          end_time: '12:00'
        },
        {
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Two weeks
          start_time: '13:00',
          end_time: '16:00'
        }
      ];
      
      for (const session of sessions) {
        const [newSession] = await sql`
          INSERT INTO teori_sessions (
            lesson_type_id, title, description, date, start_time, end_time,
            max_participants, current_participants, is_active,
            created_at, updated_at
          ) VALUES (
            ${newType.id}, ${`${type.name} - ${session.date}`},
            ${`${type.description} - ${session.start_time}`},
            ${session.date}, ${session.start_time}, ${session.end_time},
            ${type.max_participants}, 0, true,
            NOW(), NOW()
          ) RETURNING *
        `;
        
        console.log(`  Created session: ${newSession.title} on ${newSession.date}`);
      }
    }
    
    console.log('\n✅ Handledar data created successfully!');
    console.log('Handledarutbildningar should now be visible in the booking flow.');
    
  } catch (error) {
    console.error('Error creating handledar data:', error);
  }
}

createHandledarData();
