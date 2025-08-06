/**
 * Debug script to understand slot filtering
 */

function debugSlotFiltering() {
  console.log('=== Debugging Slot Filtering ===\n');
  
  // Check current time
  const now = new Date();
  console.log(`🕐 Current time: ${now.toISOString()}`);
  
  // Check test date
  const testDate = '2025-01-20';
  console.log(`📅 Test date: ${testDate}`);
  
  // Check if test date is within 3 hours from now
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  console.log(`⏰ Three hours from now: ${threeHoursFromNow.toISOString()}`);
  
  // Check each slot time
  const slotTimes = [
    '08:15:00', '09:05:00', '09:55:00', '10:55:00', '11:45:00',
    '13:10:00', '14:00:00', '14:50:00', '15:45:00', '16:35:00'
  ];
  
  console.log('\n🔍 Checking each slot time:');
  slotTimes.forEach(time => {
    const slotDateTime = new Date(`${testDate}T${time}`);
    const isWithinThreeHours = slotDateTime <= threeHoursFromNow;
    console.log(`   ${time}: ${isWithinThreeHours ? '❌ Within 3 hours' : '✅ Available'}`);
  });
  
  // Check if the issue is that the test date is in the past
  const testDateTime = new Date(testDate);
  const isTestDateInPast = testDateTime < now;
  console.log(`\n📅 Test date is in the past: ${isTestDateInPast ? 'Yes' : 'No'}`);
  
  // Check if the issue is that the test date is today
  const today = new Date();
  const isTestDateToday = testDate === today.toISOString().split('T')[0];
  console.log(`📅 Test date is today: ${isTestDateToday ? 'Yes' : 'No'}`);
  
  console.log('\n=== Debug Complete ===');
}

// Run the debug
debugSlotFiltering(); 