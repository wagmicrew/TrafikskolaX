import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import bcrypt from 'bcryptjs'

async function seedTestUsers() {
  console.log('🌱 Seeding test users...')
  
  const password = 'password123'
  const hashedPassword = await bcrypt.hash(password, 10)
  
  try {
    // Create admin user
    await db.insert(users).values({
      email: 'admin@test.se',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Administratör',
      phone: '070-123-45-67',
      role: 'admin',
      isActive: true,
    }).onConflictDoNothing()
    
    // Create teacher user
    await db.insert(users).values({
      email: 'teacher@test.se',
      password: hashedPassword,
      firstName: 'Lärare',
      lastName: 'Instruktör',
      phone: '070-234-56-78',
      role: 'teacher',
      isActive: true,
      licenseNumber: 'T123456',
      specializations: JSON.stringify(['b_license', 'assessment', 'taxi_license']),
    }).onConflictDoNothing()
    
    // Create student user
    await db.insert(users).values({
      email: 'student@test.se',
      password: hashedPassword,
      firstName: 'Elev',
      lastName: 'Körskola',
      phone: '070-345-67-89',
      role: 'student',
      isActive: true,
    }).onConflictDoNothing()
    
    console.log('✅ Test users created successfully!')
    console.log('\n📋 Test user credentials:')
    console.log('👤 Admin: admin@test.se / password123')
    console.log('👨‍🏫 Teacher: teacher@test.se / password123')
    console.log('🎓 Student: student@test.se / password123')
    
  } catch (error) {
    console.error('❌ Error seeding users:', error)
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedTestUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedTestUsers }
