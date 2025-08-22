import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function testAuth() {
  try {
    console.log('Testing database connection...');

    // Test database connection
    const testResult = await db.execute(sql`SELECT 1 as test LIMIT 1`);
    console.log('Database connection successful:', testResult);

    // Check if test user exists
    const existingUser = await db.select().from(users).where(eq(users.email, 'test@example.com'));
    console.log('Existing test user:', existingUser.length > 0 ? 'Found' : 'Not found');

    if (existingUser.length === 0) {
      // Create test user with hashed password
      const hashedPassword = await bcrypt.hash('test123', 12);
      await db.insert(users).values({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Test user created successfully');
    } else {
      console.log('Test user already exists');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testAuth();
