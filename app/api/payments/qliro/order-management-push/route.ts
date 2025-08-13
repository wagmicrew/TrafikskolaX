import { NextRequest, NextResponse } from 'next/server';

// Lightweight order management status push endpoint for Qliro
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    return NextResponse.json({ received: true, length: body.length }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}


