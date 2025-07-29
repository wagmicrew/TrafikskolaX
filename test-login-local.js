// Test login functionality locally
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { sql } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

// Direct database URL for testing
const DATABASE_URL = "postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log('🧪 Testing login logic locally...');

async function testLoginLogic() {
  try {
    // Create NEON connection
    const neonSql = neon(DATABASE_URL);
    
    // Create Drizzle instance
    const db = drizzle(neonSql);

    console.log('✅ Connected to database');

    const email = 'admin@test.se';
    const password = 'password123';

    console.log(`\n🔍 Testing login for ${email}...`);

    // Find user by email using raw SQL
    const existingUsers = await db.execute(sql`
      SELECT id, email, password, first_name, last_name, role, is_active
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `);

    console.log(`Found ${existingUsers.rows.length} users`);

    if (existingUsers.rows.length === 0) {
      console.log('❌ No user found');
      return;
    }

    const user = existingUsers.rows[0];
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active
    });

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ User is not active');
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);
    
    if (isValidPassword) {
      console.log('✅ Login would succeed!');
      
      // Test redirect URL logic
      let redirectUrl = '/dashboard';
      switch (user.role) {
        case 'admin':
          redirectUrl = '/dashboard/admin';
          break;
        case 'teacher':
          redirectUrl = '/dashboard/teacher';
          break;
        case 'student':
          redirectUrl = '/dashboard/student';
          break;
        default:
          redirectUrl = '/dashboard';
      }
      
      console.log('Redirect URL:', redirectUrl);
    } else {
      console.log('❌ Invalid password');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testLoginLogic();
