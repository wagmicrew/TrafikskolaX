import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Deprecated: internal messaging removed in favor of email-only notifications
    return NextResponse.json(
      { error: 'Internal messaging has been removed. Unread count is not available.' },
      { status: 410 }
    );
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
