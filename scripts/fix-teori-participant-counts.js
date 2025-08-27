#!/usr/bin/env node

// Simple script to fix teori participant counts
// Run with: node scripts/fix-teori-participant-counts.js

const https = require('https');
const http = require('http');

async function makeRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:3000${endpoint}`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function fixParticipantCounts() {
  try {
    console.log('🔧 Fixing teori session participant counts...\n');

    // First, get all sessions
    const sessionsResponse = await makeRequest('/api/admin/teori-sessions');
    if (!sessionsResponse.sessions) {
      console.log('❌ No sessions found or API not available');
      console.log('💡 Make sure your Next.js server is running on http://localhost:3000');
      return;
    }

    const sessions = sessionsResponse.sessions;
    console.log(`📊 Found ${sessions.length} teori sessions\n`);

    let fixedCount = 0;

    for (const session of sessions) {
      try {
        // Get actual participant count by checking bookings
        const participantsResponse = await makeRequest(`/api/admin/teori-sessions/${session.id}/participants`);
        const actualCount = participantsResponse.participants ? participantsResponse.participants.length : 0;

        if (actualCount !== session.currentParticipants) {
          console.log(`🔧 Fixing "${session.title}": ${session.currentParticipants} → ${actualCount}`);

          // Update the session with correct count
          await makeRequest(`/api/admin/teori-sessions/${session.id}`, 'PUT', {
            lessonTypeId: session.lessonTypeId,
            title: session.title,
            description: session.description,
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            maxParticipants: session.maxParticipants,
            isActive: session.isActive,
            // This will trigger the API to recalculate currentParticipants
          });

          fixedCount++;
        } else {
          console.log(`✅ "${session.title}": ${actualCount}/${session.maxParticipants} (OK)`);
        }
      } catch (error) {
        console.log(`⚠️  Could not check "${session.title}": ${error.message}`);
      }
    }

    console.log(`\n🎉 Fixed participant counts for ${fixedCount} sessions!`);
    console.log('\n📋 Summary:');
    console.log('   ✅ Sessions with correct counts are marked (OK)');
    console.log('   🔧 Sessions that were fixed are marked with arrow');
    console.log('\n💡 You can now book participants in sessions that were previously showing as full!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure your Next.js server is running: npm run dev');
    console.log('   2. Check that the server is accessible at http://localhost:3000');
    console.log('   3. Verify that the database connection is working');
  }
}

fixParticipantCounts();
