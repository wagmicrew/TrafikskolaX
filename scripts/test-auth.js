const { drizzleClient } = require('../lib/db/client.ts');
const bcrypt = require('bcryptjs');

async function testAuth() {
  try {
    console.log('Testing database connection...');

    const db = await drizzleClient();

    // Test database connection
    const result = await db.execute('SELECT 1 as test');
    console.log('Database connection successful:', result.rows);

    // Check if test user exists
    const existingUser = await db.execute('SELECT * FROM users WHERE email = $1', ['test@example.com']);
    console.log('Existing test user:', existingUser.rows.length > 0 ? 'Found' : 'Not found');

    if (existingUser.rows.length === 0) {
      // Create test user with hashed password
      const hashedPassword = await bcrypt.hash('test123', 12);
      await db.execute(
        'INSERT INTO users (id, email, password, first_name, last_name, role, is_active) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)',
        ['test@example.com', hashedPassword, 'Test', 'User', 'student', true]
      );
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
