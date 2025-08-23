const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function testSessionAPIs() {
  console.log('🧪 Testing Session Management APIs...\n');

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Test 1: Check if session tables exist
    console.log('1️⃣  Checking database tables...');

    const tables = [
      'session_types',
      'sessions',
      'session_bookings'
    ];

    for (const table of tables) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = ${table}
        )
      `;
      if (result[0].exists) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' missing`);
      }
    }

    // Test 2: Check if default session types exist
    console.log('\n2️⃣  Checking default session types...');

    const sessionTypes = await sql`
      SELECT name, type, base_price FROM session_types ORDER BY sort_order
    `;

    if (sessionTypes.length > 0) {
      console.log(`   ✅ Found ${sessionTypes.length} session types:`);
      sessionTypes.forEach(st => {
        console.log(`      - ${st.name} (${st.type}) - ${st.base_price} SEK`);
      });
    } else {
      console.log('   ❌ No session types found');
    }

    // Test 3: Check API endpoints structure
    console.log('\n3️⃣  Checking API endpoints structure...');

    const fs = require('fs');
    const path = require('path');

    const apiEndpoints = [
      'app/api/admin/session-types/route.ts',
      'app/api/admin/session-types/[id]/route.ts',
      'app/api/admin/sessions/route.ts',
      'app/api/admin/sessions/[id]/route.ts',
      'app/api/admin/sessions/[id]/add-booking/route.ts',
      'app/api/admin/sessions/[id]/participants/route.ts',
      'app/api/admin/sessions/future/route.ts',
      'app/api/admin/session-bookings/[id]/route.ts'
    ];

    for (const endpoint of apiEndpoints) {
      if (fs.existsSync(endpoint)) {
        console.log(`   ✅ API endpoint exists: ${endpoint}`);
      } else {
        console.log(`   ❌ API endpoint missing: ${endpoint}`);
      }
    }

    // Test 4: Check frontend page exists
    console.log('\n4️⃣  Checking frontend pages...');

    const frontendPages = [
      'app/dashboard/admin/teori-sessions/page.tsx'
    ];

    for (const page of frontendPages) {
      if (fs.existsSync(page)) {
        console.log(`   ✅ Page exists: ${page}`);

        // Check for Swedish text clarity
        const content = fs.readFileSync(page, 'utf8');
        const swedishTexts = [
          'Sessionshantering',
          'Lägg till deltagare',
          'Deltagare',
          'Personnummer',
          'Handledarens namn',
          'Skicka betalningsinformation'
        ];

        console.log('   📝 Swedish text check:');
        for (const text of swedishTexts) {
          if (content.includes(text)) {
            console.log(`      ✅ "${text}" found`);
          } else {
            console.log(`      ❌ "${text}" missing`);
          }
        }
      } else {
        console.log(`   ❌ Page missing: ${page}`);
      }
    }

    // Test 5: Check schema imports
    console.log('\n5️⃣  Checking schema imports...');

    const schemaFiles = [
      'lib/db/schema/session-types.ts',
      'lib/db/schema/sessions.ts',
      'lib/db/schema/session-bookings.ts'
    ];

    for (const schema of schemaFiles) {
      if (fs.existsSync(schema)) {
        console.log(`   ✅ Schema file exists: ${schema}`);
      } else {
        console.log(`   ❌ Schema file missing: ${schema}`);
      }
    }

    console.log('\n🎉 Session Management API Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSessionAPIs();
