import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Deprecated: internal messaging removed in favor of email-only notifications
    return NextResponse.json(
      { error: 'Internal messaging has been removed. Please use email notifications.' },
      { status: 410 }
    );
  } catch (error) {
    console.error('Error fetching internal messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Deprecated: internal messaging removed in favor of email-only notifications
    return NextResponse.json(
      { error: 'Internal messaging has been removed. Please use email notifications.' },
      { status: 410 }
    );
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
  }
}
