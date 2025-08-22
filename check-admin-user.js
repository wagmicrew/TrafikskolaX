const { db } = require('./lib/db');
const { users } = require('./lib/db/schema');
const { eq } = require('drizzle-orm');

async function checkAdminUser() {
  try {
    console.log('Checking for admin user...');
    const adminUsers = await db.select().from(users).where(eq(users.email, 'admin@dintrafikskolahlm.se'));
    console.log('Admin user found:', adminUsers.length > 0);

    if (adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log('Admin user details:');
      console.log('- ID:', admin.id);
      console.log('- Email:', admin.email);
      console.log('- Role:', admin.role);
      console.log('- Active:', admin.isActive);
      console.log('- Password hash length:', admin.password ? admin.password.length : 'null');
      console.log('- Password hash preview:', admin.password ? admin.password.substring(0, 20) + '...' : 'null');
    } else {
      console.log('No admin user found with email: admin@dintrafikskolahlm.se');
      console.log('Let me check if there are any admin users at all...');
      const allAdmins = await db.select().from(users).where(eq(users.role, 'admin'));
      console.log('Total admin users found:', allAdmins.length);
      if (allAdmins.length > 0) {
        allAdmins.forEach((admin, index) => {
          console.log(`Admin ${index + 1}: ${admin.email} (Active: ${admin.isActive})`);
        });
      }
    }
  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    process.exit(0);
  }
}

checkAdminUser();
