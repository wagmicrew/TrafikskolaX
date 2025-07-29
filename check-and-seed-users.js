// Check existing users and seed test users if needed
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { sql } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

// Direct database URL for testing
const DATABASE_URL = "postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log('🔍 Checking users in NEON Database...');

async function checkAndSeedUsers() {
  try {
    // Create NEON connection
    const neonSql = neon(DATABASE_URL);
    
    // Create Drizzle instance
    const db = drizzle(neonSql);
    
    console.log('✅ Connected to database');
    
    // Check existing users
    const existingUsers = await db.execute(sql`SELECT email, role, first_name, last_name FROM users ORDER BY role, email`);
    
    console.log('\n📋 Current users in database:');
    if (existingUsers.rows.length === 0) {
      console.log('❌ No users found in database');
    } else {
      existingUsers.rows.forEach(user => {
        console.log(`👤 ${user.role.toUpperCase()}: ${user.email} (${user.first_name} ${user.last_name})`);
      });
    }
    
    // Seed test users if none exist
    if (existingUsers.rows.length === 0) {
      console.log('\n🌱 Seeding test users...');
      
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create admin user
      await db.execute(sql`
        INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
        VALUES ('admin@test.se', ${hashedPassword}, 'Admin', 'Administratör', '070-123-45-67', 'admin', true)
        ON CONFLICT (email) DO NOTHING
      `);
      
      // Create teacher user
      await db.execute(sql`
        INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
        VALUES ('teacher@test.se', ${hashedPassword}, 'Lärare', 'Instruktör', '070-234-56-78', 'teacher', true)
        ON CONFLICT (email) DO NOTHING
      `);
      
      // Create student user
      await db.execute(sql`
        INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
        VALUES ('student@test.se', ${hashedPassword}, 'Elev', 'Körskola', '070-345-67-89', 'student', true)
        ON CONFLICT (email) DO NOTHING
      `);
      
      console.log('✅ Test users created successfully!');
      console.log('\n📋 Test user credentials:');
      console.log('👤 Admin: admin@test.se / password123');
      console.log('👨‍🏫 Teacher: teacher@test.se / password123');
      console.log('🎓 Student: student@test.se / password123');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

checkAndSeedUsers();
