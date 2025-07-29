import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

async function setupDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const result = await db.execute(sql`SELECT current_database(), current_user, version()`);
    console.log('Database connection successful!');
    console.log('Connection info:', result);

    // Check if users table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    console.log('Users table exists:', tableCheck.rows[0].exists);

    // Create test users if they don't exist
    const testUsers = [
      {
        email: 'admin@test.se',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Admin',
        lastName: 'Test',
        phone: '0701234567',
        role: 'admin' as const,
        isActive: true,
      },
      {
        email: 'teacher@test.se',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Lärare',
        lastName: 'Test',
        phone: '0702345678',
        role: 'teacher' as const,
        isActive: true,
      },
      {
        email: 'student@test.se',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Elev',
        lastName: 'Test',
        phone: '0703456789',
        role: 'student' as const,
        isActive: true,
      },
    ];

    for (const user of testUsers) {
      try {
        // Check if user exists
        const existing = await db
          .select()
          .from(users)
          .where(sql`email = ${user.email}`)
          .limit(1);

        if (existing.length === 0) {
          // Insert new user
          await db.insert(users).values(user);
          console.log(`Created user: ${user.email}`);
        } else {
          console.log(`User already exists: ${user.email}`);
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }

    console.log('Database setup completed!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
