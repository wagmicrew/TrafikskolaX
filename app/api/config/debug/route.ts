import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Check if debug mode is enabled via environment variable
  const debugMode = process.env.DEBUG_MODE === 'true';
  
  return NextResponse.json({
    debugMode,
    timestamp: new Date().toISOString()
  });
}
