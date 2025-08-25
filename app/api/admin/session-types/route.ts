import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
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
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();

    const result = await client.query(`
      SELECT
        id, name, description, type, credit_type as "creditType",
        base_price as "basePrice", price_per_supervisor as "pricePerSupervisor",
        duration_minutes as "durationMinutes", max_participants as "maxParticipants",
        allows_supervisors as "allowsSupervisors", requires_personal_id as "requiresPersonalId",
        is_active as "isActive", sort_order as "sortOrder",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM session_types
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

export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, creditType, basePrice, pricePerSupervisor, durationMinutes, maxParticipants, allowsSupervisors, requiresPersonalId, sortOrder } = body;

    await client.connect();

    const result = await client.query(`
      INSERT INTO session_types (
        name, description, type, credit_type, base_price, price_per_supervisor,
        duration_minutes, max_participants, allows_supervisors, requires_personal_id,
        sort_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      RETURNING
        id, name, description, type, credit_type as "creditType",
        base_price as "basePrice", price_per_supervisor as "pricePerSupervisor",
        duration_minutes as "durationMinutes", max_participants as "maxParticipants",
        allows_supervisors as "allowsSupervisors", requires_personal_id as "requiresPersonalId",
        is_active as "isActive", sort_order as "sortOrder",
        created_at as "createdAt", updated_at as "updatedAt"
    `, [
      name,
      description,
      type,
      creditType,
      parseFloat(basePrice),
      pricePerSupervisor ? parseFloat(pricePerSupervisor) : null,
      durationMinutes,
      maxParticipants,
      Boolean(allowsSupervisors),
      Boolean(requiresPersonalId),
      parseInt(sortOrder) || 0
    ]);

    return NextResponse.json({
      message: 'Session type created successfully',
      sessionType: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating session type:', error);
    return NextResponse.json({ error: 'Failed to create session type' }, { status: 500 });
  } finally {
    await client.end();
  }
}
