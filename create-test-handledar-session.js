const { Client } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

async function createTestSession() {
  const client = new Client({
    connectionString: envVars.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get a teacher user ID (first teacher or admin we find)
    const teacherResult = await client.query(`
      SELECT id FROM users WHERE role IN ('teacher', 'admin') LIMIT 1
    `);

    const teacherId = teacherResult.rows[0]?.id || null;

    // Create a test session for next week
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const sessionDate = nextWeek.toISOString().split('T')[0];

    const insertResult = await client.query(`
      INSERT INTO handledar_sessions (
        title, 
        description, 
        date, 
        start_time, 
        end_time, 
        max_participants, 
        current_participants, 
        price_per_participant, 
        teacher_id, 
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, title, date, start_time, end_time
    `, [
      'Introduktion till Handledarkurs',
      'En grundläggande introduktion till att vara handledare för övningskörning',
      sessionDate,
      '10:00',
      '12:00',
      8, // max participants
      0, // current participants
      1200, // price per participant (12 kr)
      teacherId,
      true
    ]);

    console.log('Test session created successfully:', insertResult.rows[0]);
    console.log('Session date:', sessionDate);
    console.log('Teacher ID:', teacherId || 'No teacher assigned');

  } catch (error) {
    console.error('Error creating test session:', error);
  } finally {
    await client.end();
  }
}

createTestSession();
