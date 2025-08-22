// Usage: node scripts/reset-admin-password.js admin@dintrafikskolahlm.se
// Requires env DATABASE_URL

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
try { require('dotenv').config(); } catch (_) {}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/reset-admin-password.js <email>');
    process.exit(1);
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(dbUrl);
  const newPassword = 'trafikskolahlm';
  const hash = await bcrypt.hash(newPassword, 12);

  // Find user by email first using tagged template
  const found = await sql`SELECT id, email FROM users WHERE email = ${email}`;
  if (!found || found.length === 0) {
    console.error('No such user:', email);
    process.exit(1);
  }

  const id = found[0].id;
  const upd = await sql`UPDATE users SET password = ${hash} WHERE id = ${id} RETURNING id, email`;
  console.log('Updated user:', upd[0]);
  console.log('New admin password:', newPassword);
}

main().catch((e) => {
  console.error('Failed to reset password:', e);
  process.exit(1);
});


