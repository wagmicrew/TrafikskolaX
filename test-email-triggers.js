#!/usr/bin/env node

// Test script to verify email triggers are working correctly
// Run with: node test-email-triggers.js

const { EmailService } = require('./lib/email/email-service');
const { logger } = require('./lib/logging/logger');

async function testEmailTriggers() {
  console.log('🧪 Testing Email Triggers...\n');

  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'student'
  };

  const testBooking = {
    id: 'booking-456',
    scheduledDate: '2024-01-15',
    startTime: '14:00',
    endTime: '15:00',
    lessonTypeName: 'B-körkort 45 min',
    totalPrice: '695',
    swishUUID: 'test-swish-123'
  };

  const testAdmin = {
    email: 'admin@dintrafikskolahlm.se'
  };

  // Test all required triggers
  const triggersToTest = [
    {
      name: 'new_user',
      context: { user: testUser }
    },
    {
      name: 'new_booking',
      context: { user: testUser, booking: testBooking, admin: testAdmin }
    },
    {
      name: 'new_password',
      context: { 
        user: testUser, 
        customData: { temporaryPassword: 'temp123456' }
      }
    },
    {
      name: 'payment_confirmation_request',
      context: { user: testUser, booking: testBooking, admin: testAdmin }
    },
    {
      name: 'booking_reminder',
      context: { user: testUser, booking: testBooking }
    }
  ];

  let passedTests = 0;
  let totalTests = triggersToTest.length;

  for (const trigger of triggersToTest) {
    try {
      console.log(`📧 Testing trigger: ${trigger.name}`);
      
      const result = await EmailService.sendTriggeredEmail(trigger.name, trigger.context);
      
      if (result) {
        console.log(`✅ ${trigger.name} - SUCCESS`);
        passedTests++;
      } else {
        console.log(`❌ ${trigger.name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${trigger.name} - ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} triggers passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All email triggers are working correctly!');
  } else {
    console.log('⚠️  Some email triggers failed - check configuration and database');
  }

  // Display log stats
  try {
    const logStats = logger.getLogStats();
    console.log(`\n📝 Log files created: ${logStats.totalFiles}`);
    console.log(`📈 Email logs: ${logStats.categories.email || 0}`);
  } catch (error) {
    console.log('⚠️  Could not retrieve log statistics');
  }
}

// Run the test
testEmailTriggers().catch(console.error);

module.exports = { testEmailTriggers };
