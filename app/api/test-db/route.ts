import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('🔍 Test DB route called');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    const result = await client.query('SELECT 1 as test');
    console.log('✅ Query successful:', result.rows);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      testResult: result.rows
    });
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return NextResponse.json({
      error: 'Database connection failed',
      message: error.message
    }, { status: 500 });
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}
