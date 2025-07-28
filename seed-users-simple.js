require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function seedTestUsers() {
  console.log('🌱 Seeding test users...');

  const sql = neon(process.env.DATABASE_URL);
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Create admin user
    await sql`
      INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
      VALUES (${'admin@test.se'}, ${hashedPassword}, ${'Admin'}, ${'Administratör'}, ${'070-123-45-67'}, ${'admin'}, ${true})
      ON CONFLICT (email) DO NOTHING
    `;

    // Create teacher user  
    await sql`
      INSERT INTO users (email, password, first_name, last_name, phone, role, is_active, license_number, specializations)
      VALUES (${'teacher@test.se'}, ${hashedPassword}, ${'Lärare'}, ${'Instruktör'}, ${'070-234-56-78'}, ${'teacher'}, ${true}, ${'T123456'}, ${JSON.stringify(['b_license', 'assessment', 'taxi_license'])})
      ON CONFLICT (email) DO NOTHING
    `;

    // Create student user
    await sql`
      INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
      VALUES (${'student@test.se'}, ${hashedPassword}, ${'Elev'}, ${'Körskola'}, ${'070-345-67-89'}, ${'student'}, ${true})
      ON CONFLICT (email) DO NOTHING
    `;

    console.log('✅ Test users created successfully!');
    console.log('\n📋 Test user credentials:');
    console.log('👤 Admin: admin@test.se / password123');
    console.log('👨‍🏫 Teacher: teacher@test.se / password123');
    console.log('🎓 Student: student@test.se / password123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
}

seedTestUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
