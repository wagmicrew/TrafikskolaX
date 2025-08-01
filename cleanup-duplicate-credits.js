const { neon } = require('@neondatabase/serverless');

// Database connection
const DATABASE_URL = "postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function cleanupDuplicateCredits() {
  console.log('🧹 Cleaning up duplicate handledar credits...');
  
  const USER_ID = 'd601c43a-599c-4715-8b9a-65fe092c6c11';
  
  try {
    // First, get all handledar credits for this user
    const handledarCredits = await sql`
      SELECT * FROM user_credits 
      WHERE user_id = ${USER_ID} 
      AND credit_type = 'handledar'
      AND handledar_session_id IS NULL
      ORDER BY created_at ASC
    `;
    
    console.log(`Found ${handledarCredits.length} generic handledar credit entries`);
    
    if (handledarCredits.length > 1) {
      // Keep the first one (oldest) and sum up all the credits
      const firstCredit = handledarCredits[0];
      const totalCreditsRemaining = handledarCredits.reduce((sum, credit) => sum + credit.credits_remaining, 0);
      const totalCreditsTotal = handledarCredits.reduce((sum, credit) => sum + credit.credits_total, 0);
      
      console.log(`Total credits remaining: ${totalCreditsRemaining}`);
      console.log(`Total credits total: ${totalCreditsTotal}`);
      
      // Update the first credit with the sum
      await sql`
        UPDATE user_credits 
        SET credits_remaining = ${totalCreditsRemaining},
            credits_total = ${totalCreditsTotal},
            updated_at = NOW()
        WHERE id = ${firstCredit.id}
      `;
      
      // Delete all the duplicates
      const idsToDelete = handledarCredits.slice(1).map(c => c.id);
      if (idsToDelete.length > 0) {
        await sql`
          DELETE FROM user_credits 
          WHERE id = ANY(${idsToDelete})
        `;
        console.log(`✅ Deleted ${idsToDelete.length} duplicate entries`);
      }
    } else {
      console.log('✅ No duplicates found');
    }
    
    // Show final state
    const finalCredits = await sql`
      SELECT * FROM user_credits 
      WHERE user_id = ${USER_ID}
      ORDER BY created_at DESC
    `;
    
    console.log('\n📋 Final credits state:');
    finalCredits.forEach(credit => {
      const type = credit.credit_type;
      const remaining = credit.credits_remaining;
      const total = credit.credits_total;
      console.log(`- ${type}: ${remaining} remaining (Total: ${total})`);
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up credits:', error);
    throw error;
  }
}

// Run the cleanup
cleanupDuplicateCredits()
  .then(() => {
    console.log('\n🎉 Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
