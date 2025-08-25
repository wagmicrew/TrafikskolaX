import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Deprecated: internal messaging removed in favor of email-only notifications
    return NextResponse.json(
      { error: 'Internal messaging has been removed. Please use email notifications.' },
      { status: 410 }
    );
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Deprecated: internal messaging removed in favor of email-only notifications
    return NextResponse.json(
      { error: 'Internal messaging has been removed. Please use email notifications.' },
      { status: 410 }
    );
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
