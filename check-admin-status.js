const { neon } = require('@neondatabase/serverless');
try { require('dotenv').config(); } catch (_) {}

async function checkAdminStatus() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(dbUrl);

  try {
    console.log('Checking admin users...');

    // Check for admin users
    const adminUsers = await sql`SELECT id, email, role, is_active FROM users WHERE role = 'admin'`;
    console.log('Found admin users:', adminUsers.length);

    adminUsers.forEach((user, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.is_active}`);
      console.log('');
    });

    // Check specifically for the expected admin email
    const specificAdmin = await sql`SELECT id, email, role, is_active FROM users WHERE email = 'admin@dintrafikskolahlm.se'`;
    if (specificAdmin && specificAdmin.length > 0) {
      console.log('Specific admin user found:');
      console.log(`  Email: ${specificAdmin[0].email}`);
      console.log(`  Role: ${specificAdmin[0].role}`);
      console.log(`  Active: ${specificAdmin[0].is_active}`);
    } else {
      console.log('No admin user found with email: admin@dintrafikskolahlm.se');
    }

  } catch (error) {
    console.error('Error checking admin status:', error);
  } finally {
    process.exit(0);
  }
}

checkAdminStatus();
