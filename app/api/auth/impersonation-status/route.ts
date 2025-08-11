import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin-session-token')?.value;
    return NextResponse.json({ impersonating: Boolean(adminToken) });
  } catch (e) {
    return NextResponse.json({ impersonating: false });
  }
}


