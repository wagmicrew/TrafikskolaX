#!/usr/bin/env node

/**
 * Script to remove test users from the database
 * Removes: admin@test.se, teacher@test.se, student@test.se
 */

import { db } from '../lib/db/index.js';
import { users } from '../lib/db/schema.js';
import { eq, inArray } from 'drizzle-orm';

const TEST_EMAILS = [
  'admin@test.se',
  'teacher@test.se', 
  'student@test.se'
];

async function removeTestUsers() {
  try {
    console.log('🗑️  Removing test users from database...');
    
    // Delete test users
    const result = await db.delete(users)
      .where(inArray(users.email, TEST_EMAILS));
    
    console.log('✅ Test users removed successfully');
    console.log('📧 Removed emails:');
    TEST_EMAILS.forEach(email => {
      console.log(`   - ${email}`);
    });
    
    // Verify removal
    const remainingTestUsers = await db.select()
      .from(users)
      .where(inArray(users.email, TEST_EMAILS));
    
    if (remainingTestUsers.length === 0) {
      console.log('✅ Verification: No test users remain in database');
    } else {
      console.log('⚠️  Warning: Some test users may still exist');
      remainingTestUsers.forEach(user => {
        console.log(`   - ${user.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error removing test users:', error);
    process.exit(1);
  }
}

// Run the script
removeTestUsers()
  .then(() => {
    console.log('🎉 Test user removal completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 