const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkHandledarSessions() {
  try {
    await client.connect();
    const result = await client.query(`
      SELECT name, type, allows_supervisors, price_per_supervisor, requires_personal_id
      FROM session_types
      WHERE type = 'handledarkurs' OR type = 'handledarutbildning' OR name ILIKE '%handledar%'
    `);

    const allSessions = await client.query(`
      SELECT name, type, allows_supervisors, price_per_supervisor, requires_personal_id
      FROM session_types
      ORDER BY name
    `);
    console.log('Handledar sessions:', result.rows);
    console.log('All sessions:', allSessions.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkHandledarSessions();
