import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT
        id, name, description, type, base_price as "basePrice",
        price_per_supervisor as "pricePerSupervisor",
        duration_minutes as "durationMinutes",
        max_participants as "maxParticipants",
        allows_supervisors as "allowsSupervisors",
        is_active as "isActive",
        sort_order as "sortOrder"
      FROM session_types
      WHERE is_active = true
      ORDER BY sort_order DESC, created_at DESC
    `);

    return NextResponse.json({ sessionTypes: result.rows });
  } catch (error) {
    console.error('Error fetching session types:', error);
    return NextResponse.json({ error: 'Failed to fetch session types' }, { status: 500 });
  } finally {
    await client.end();
  }
}
