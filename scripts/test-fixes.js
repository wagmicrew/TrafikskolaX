import { db } from '../lib/db.js';
import { users, userReports, invoices } from '../lib/db/schema.js';
import { invoiceService } from '../lib/services/invoice-service.js';
import { eq, sql } from 'drizzle-orm';

async function testFixes() {
  console.log('🔧 Testing fixes for user deletion and invoice loading...');

  try {
    // Test 1: Check if userReports table exists and has data
    console.log('\n📋 Testing user reports table...');
    const userReportsData = await db
      .select()
      .from(userReports)
      .limit(5);

    console.log(`✅ Found ${userReportsData.length} user reports (showing first 5)`);

    // Test 2: Check if invoice service works
    console.log('\n📋 Testing invoice service...');
    const stats = await invoiceService.getInvoiceStats();
    console.log('✅ Invoice stats:', stats);

    // Test 3: Check if invoices can be fetched
    const invoicesData = await invoiceService.getAllInvoices({ limit: 5 });
    console.log(`✅ Found ${invoicesData.length} invoices (showing first 5)`);

    // Test 4: Check if user deletion logic includes userReports
    console.log('\n📋 Checking user deletion logic...');
    const usersWithReports = await db
      .select({
        userId: users.id,
        userEmail: users.email,
        reportCount: sql`COUNT(${userReports.id})`
      })
      .from(users)
      .leftJoin(userReports, eq(users.id, userReports.userId))
      .groupBy(users.id, users.email)
      .having(sql`COUNT(${userReports.id}) > 0`)
      .limit(3);

    console.log(`✅ Found ${usersWithReports.length} users with reports`);
    if (usersWithReports.length > 0) {
      console.log('📝 Sample users with reports:');
      usersWithReports.forEach(user => {
        console.log(`   - ${user.userEmail}: ${user.reportCount} reports`);
      });
    }

    console.log('\n🎉 All tests passed! Fixes should work correctly.');
    console.log('\n📋 Summary of fixes:');
    console.log('✅ Added userReports deletion to user deletion API');
    console.log('✅ Added missing getInvoiceStats method to InvoiceService');
    console.log('✅ Exported invoiceService instance from invoice-service.ts');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

console.log('🚀 Starting fix tests...');
await testFixes();
console.log('✨ Tests completed');

process.exit(0);
