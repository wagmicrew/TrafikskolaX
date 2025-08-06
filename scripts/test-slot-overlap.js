/**
 * Test script to verify slot overlap checking functionality
 */

// Test cases for time overlap checking
const testCases = [
  {
    name: "Exact match - should overlap",
    booking: { startTime: "10:00", endTime: "11:00" },
    slot: { startTime: "10:00", endTime: "11:00" },
    expected: true
  },
  {
    name: "Booking starts before slot, ends during slot - should overlap",
    booking: { startTime: "09:30", endTime: "10:30" },
    slot: { startTime: "10:00", endTime: "11:00" },
    expected: true
  },
  {
    name: "Booking starts during slot, ends after slot - should overlap",
    booking: { startTime: "10:30", endTime: "11:30" },
    slot: { startTime: "10:00", endTime: "11:00" },
    expected: true
  },
  {
    name: "Booking completely contains slot - should overlap",
    booking: { startTime: "09:00", endTime: "12:00" },
    slot: { startTime: "10:00", endTime: "11:00" },
    expected: true
  },
  {
    name: "Booking completely within slot - should overlap",
    booking: { startTime: "10:15", endTime: "10:45" },
    slot: { startTime: "10:00", endTime: "11:00" },
    expected: true
  },
  {
    name: "Booking before slot - should not overlap",
    booking: { startTime: "08:00", endTime: "09:00" },
    slot: { startTime: "10:00", endTime: "11:00" },
    expected: false
  },
  {
    name: "Booking after slot - should not overlap",
    booking: { startTime: "11:00", endTime: "12:00" },
    slot: { startTime: "10:00", endTime: "11:00" },
    expected: false
  },
  {
    name: "Booking ends exactly when slot starts - should not overlap",
    booking: { startTime: "09:00", endTime: "10:00" },
    slot: { startTime: "10:00", endTime: "11:00" },
    expected: false
  },
  {
    name: "Booking starts exactly when slot ends - should not overlap",
    booking: { startTime: "11:00", endTime: "12:00" },
    slot: { startTime: "10:00", endTime: "11:00" },
    expected: false
  }
];

// Simple time overlap function for testing
function doTimeRangesOverlap(start1, end1, start2, end2) {
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

// Run tests
console.log("Testing slot overlap functionality...\n");

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  const result = doTimeRangesOverlap(
    testCase.booking.startTime,
    testCase.booking.endTime,
    testCase.slot.startTime,
    testCase.slot.endTime
  );

  const passed = result === testCase.expected;
  
  if (passed) {
    passedTests++;
    console.log(`✅ Test ${index + 1}: ${testCase.name}`);
  } else {
    failedTests++;
    console.log(`❌ Test ${index + 1}: ${testCase.name}`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    console.log(`   Booking: ${testCase.booking.startTime}-${testCase.booking.endTime}`);
    console.log(`   Slot: ${testCase.slot.startTime}-${testCase.slot.endTime}`);
  }
});

console.log(`\nResults: ${passedTests} passed, ${failedTests} failed`);

if (failedTests === 0) {
  console.log("🎉 All tests passed! The overlap checking logic is working correctly.");
} else {
  console.log("⚠️  Some tests failed. The overlap checking logic needs to be fixed.");
} 