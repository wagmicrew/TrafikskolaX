// Simple seed script using fetch to create users via API
const users = [
  {
    email: 'admin@test.se',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'Administratör',
    phone: '070-123-45-67',
    role: 'admin'
  },
  {
    email: 'teacher@test.se',
    password: 'password123',
    firstName: 'Lärare',
    lastName: 'Instruktör',
    phone: '070-234-56-78',
    role: 'teacher'
  },
  {
    email: 'student@test.se',
    password: 'password123',
    firstName: 'Elev',
    lastName: 'Körskola',
    phone: '070-345-67-89',
    role: 'student'
  }
];

async function createUser(user) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Created user: ${user.email} (${user.role})`);
      return true;
    } else {
      console.log(`⚠️  User ${user.email} might already exist or error occurred: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error creating user ${user.email}:`, error.message);
    return false;
  }
}

async function seedUsers() {
  console.log('🌱 Seeding test users via API...');
  
  for (const user of users) {
    await createUser(user);
  }
  
  console.log('\n📋 Test user credentials:');
  console.log('👤 Admin: admin@test.se / password123');
  console.log('👨‍🏫 Teacher: teacher@test.se / password123');  
  console.log('🎓 Student: student@test.se / password123');
  console.log('\n🎉 Seeding completed!');
}

seedUsers().catch(console.error);
