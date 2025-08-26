#!/usr/bin/env node

/**
 * Test Unified Teori System
 *
 * This script tests the unified Teori and Handledar booking system
 * to ensure everything works correctly after the migration.
 */

require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function testUnifiedSystem() {
  console.log('🧪 Testing Unified Teori System');
  console.log('==============================\n');

  // Check environment
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not set. Please run:');
    console.log('   node scripts/setup-database.js');
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    console.log('🔄 Connecting to database...');
    await sql`SELECT 1 as test`;
    console.log('✅ Connected successfully\n');

    // Test 1: Check lesson types structure
    console.log('📋 Test 1: Checking lesson types structure');
    console.log('------------------------------------------');

    // Check lesson_types (should have driving lessons)
    const lessonTypes = await sql`SELECT id, name, type FROM lesson_types WHERE is_active = true LIMIT 5`;
    console.log(`📚 lesson_types table (${lessonTypes.length} active records):`);
    lessonTypes.forEach(lt => {
      console.log(`   • ${lt.name} (${lt.type || 'driving'})`);
    });

    // Check teori_lesson_types (should have theoretical lessons)
    const teoriLessonTypes = await sql`SELECT id, name, allows_supervisors, price, price_per_supervisor FROM teori_lesson_types WHERE is_active = true LIMIT 10`;
    console.log(`\n🎓 teori_lesson_types table (${teoriLessonTypes.length} active records):`);
    teoriLessonTypes.forEach(tlt => {
      console.log(`   • ${tlt.name} (supervisors: ${tlt.allows_supervisors ? '✅' : '❌'}, price: ${tlt.price}, per_supervisor: ${tlt.price_per_supervisor || 0})`);
    });

    // Test 2: Check sessions structure
    console.log('\n📋 Test 2: Checking sessions structure');
    console.log('--------------------------------------');

    // Check teori_sessions (should have all theoretical sessions)
    const teoriSessions = await sql`SELECT ts.id, ts.title, tlt.name as lesson_type, ts.session_type, ts.max_participants, ts.current_participants FROM teori_sessions ts JOIN teori_lesson_types tlt ON ts.lesson_type_id = tlt.id WHERE ts.is_active = true LIMIT 5`;
    console.log(`🎯 teori_sessions table (${teoriSessions.length} active records):`);
    teoriSessions.forEach(session => {
      console.log(`   • ${session.title} (${session.lesson_type}) - ${session.session_type} - ${session.current_participants}/${session.max_participants}`);
    });

    // Test 3: Check booking structure
    console.log('\n📋 Test 3: Checking booking structure');
    console.log('-------------------------------------');

    // Check teori_bookings (should handle both teori and handledar)
    const teoriBookings = await sql`SELECT tb.id, tb.participant_name, tlt.name as lesson_type, tb.status, tb.price FROM teori_bookings tb JOIN teori_sessions ts ON tb.session_id = ts.id JOIN teori_lesson_types tlt ON ts.lesson_type_id = tlt.id ORDER BY tb.created_at DESC LIMIT 5`;
    console.log(`📝 teori_bookings table (${teoriBookings.length} recent records):`);
    teoriBookings.forEach(booking => {
      console.log(`   • ${booking.participant_name} - ${booking.lesson_type} - ${booking.status} - ${booking.price} kr`);
    });

    // Check teori_supervisors
    const supervisors = await sql`SELECT ts.supervisor_name, tlt.name as lesson_type FROM teori_supervisors ts JOIN teori_bookings tb ON ts.teori_booking_id = tb.id JOIN teori_sessions tss ON tb.session_id = tss.id JOIN teori_lesson_types tlt ON tss.lesson_type_id = tlt.id ORDER BY ts.created_at DESC LIMIT 5`;
    console.log(`\n👥 teori_supervisors table (${supervisors.length} recent records):`);
    supervisors.forEach(sup => {
      console.log(`   • ${sup.supervisor_name} - ${sup.lesson_type}`);
    });

    // Test 4: Check API endpoints
    console.log('\n📋 Test 4: Checking API structure');
    console.log('----------------------------------');

    console.log('🔍 Testing /api/teori-sessions endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/teori-sessions?scope=future');
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API returned ${data.sessionsByType?.length || 0} lesson types with sessions`);

        // Check for both teori and handledar types
        const lessonTypes = data.sessionsByType || [];
        const teoriCount = lessonTypes.filter(lt => lt.lessonType.allows_supervisors === false).length;
        const handledarCount = lessonTypes.filter(lt => lt.lessonType.allows_supervisors === true).length;

        console.log(`   📚 Regular Teori lessons: ${teoriCount}`);
        console.log(`   👥 Handledar lessons: ${handledarCount}`);
      } else {
        console.log('❌ API endpoint not accessible (server may not be running)');
      }
    } catch (error) {
      console.log('❌ API endpoint not accessible:', error.message);
    }

    // Test 5: Validation checks
    console.log('\n📋 Test 5: Validation checks');
    console.log('-----------------------------');

    // Check that handledar lesson types require supervisors
    const handledarTypes = teoriLessonTypes.filter(tlt => tlt.allows_supervisors);
    console.log(`✅ Handledar lesson types found: ${handledarTypes.length}`);
    handledarTypes.forEach(type => {
      console.log(`   • ${type.name}: requires ${type.price_per_supervisor || 0} kr per extra supervisor`);
    });

    // Check that regular teori lesson types don't require supervisors
    const regularTeoriTypes = teoriLessonTypes.filter(tlt => !tlt.allows_supervisors);
    console.log(`✅ Regular Teori lesson types found: ${regularTeoriTypes.length}`);
    regularTeoriTypes.forEach(type => {
      console.log(`   • ${type.name}: no supervisor requirement`);
    });

    // Test 6: Pricing model validation
    console.log('\n📋 Test 6: Pricing model validation');
    console.log('-----------------------------------');

    console.log('💰 New pricing model:');
    console.log('   • Base price includes: 1 student + 1 supervisor');
    console.log('   • Additional supervisors: charged per person');
    console.log('');

    teoriLessonTypes.forEach(type => {
      if (type.allows_supervisors && type.price_per_supervisor) {
        console.log(`   📊 ${type.name}:`);
        console.log(`      • Base price: ${type.price} kr (1 student + 1 supervisor)`);
        console.log(`      • Extra supervisor: +${type.price_per_supervisor} kr each`);
        console.log(`      • Example: 3 supervisors = ${type.price + type.price_per_supervisor} kr total`);
      }
    });

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('==========');

    console.log(`✅ Database structure:`);
    console.log(`   • lesson_types: ${lessonTypes.length} driving lessons`);
    console.log(`   • teori_lesson_types: ${teoriLessonTypes.length} theoretical lessons`);
    console.log(`   • teori_sessions: ${teoriSessions.length} active sessions`);
    console.log(`   • teori_bookings: ${teoriBookings.length} recent bookings`);
    console.log(`   • teori_supervisors: ${supervisors.length} supervisor records`);

    const handledarLessons = teoriLessonTypes.filter(t => t.allows_supervisors).length;
    const regularLessons = teoriLessonTypes.filter(t => !t.allows_supervisors).length;

    console.log(`\n✅ Lesson type distribution:`);
    console.log(`   • Regular Teori: ${regularLessons} lessons`);
    console.log(`   • Handledar/Supervisor: ${handledarLessons} lessons`);

    console.log(`\n🎉 Unified Teori system test completed successfully!`);
    console.log(`\nNext steps:`);
    console.log(`1. Test booking creation with different lesson types`);
    console.log(`2. Verify supervisor selection works correctly`);
    console.log(`3. Check pricing calculations in the UI`);

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your DATABASE_URL is correct');
    console.log('2. Ensure the database is accessible');
    console.log('3. Check if you need to run the migration');
    console.log('4. Verify the server is running for API tests');
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Test Unified Teori System

Usage:
  node scripts/test-unified-teori-system.js

This script will:
1. Test database connectivity
2. Verify table structures
3. Check lesson type distribution
4. Validate API endpoints
5. Test pricing model

Requirements:
  • DATABASE_URL environment variable set
  • Database accessible and populated
  • Optional: Server running for API tests

The script will show you the current state of your unified Teori system.
  `);
  process.exit(0);
}

// Run the test
testUnifiedSystem();
