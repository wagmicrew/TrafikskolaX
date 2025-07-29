const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function addInskrvenColumn() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Adding inskriven column to users table...');
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS inskriven BOOLEAN DEFAULT false
    `;
    
    console.log('Successfully added inskriven column!');
    
    // Verify the column was added
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'inskriven'
    `;
    
    if (result.length > 0) {
      console.log('Verified: inskriven column exists in users table');
    }
    
  } catch (error) {
    console.error('Error adding column:', error);
  }
}

addInskrvenColumn();
