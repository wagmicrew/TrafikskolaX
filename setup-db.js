const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function setupDatabase() {
  const sql = neon(DATABASE_URL);
  
  try {
    console.log('Creating users table if not exists...');
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        personal_number VARCHAR(20),
        address TEXT,
        postal_code VARCHAR(10),
        city VARCHAR(100),
        role VARCHAR(20) DEFAULT 'student',
        is_active BOOLEAN DEFAULT true,
        profile_image TEXT,
        date_of_birth DATE,
        license_number VARCHAR(50),
        specializations TEXT[],
        inskriven VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Users table created or already exists');
    
    // Create test users
    const testUsers = [
      {
        email: 'admin@test.se',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Admin',
        lastName: 'Test',
        phone: '0701234567',
        role: 'admin'
      },
      {
        email: 'teacher@test.se',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Lärare',
        lastName: 'Test',
        phone: '0702345678',
        role: 'teacher'
      },
      {
        email: 'student@test.se',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Elev',
        lastName: 'Test',
        phone: '0703456789',
        role: 'student'
      }
    ];
    
    for (const user of testUsers) {
      try {
        await sql`
          INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
          VALUES (${user.email}, ${user.password}, ${user.firstName}, ${user.lastName}, ${user.phone}, ${user.role}, true)
          ON CONFLICT (email) DO NOTHING
        `;
        console.log(`User ${user.email} created or already exists`);
      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error.message);
      }
    }
    
    // Verify users were created
    const users = await sql`SELECT email, role FROM users`;
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
    console.log('\nDatabase setup completed successfully!');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupDatabase();
