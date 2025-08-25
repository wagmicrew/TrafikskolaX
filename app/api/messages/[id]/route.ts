import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Deprecated: internal messaging removed in favor of email-only notifications
    return NextResponse.json(
      { error: 'Internal messaging has been removed. Please use email notifications.' },
      { status: 410 }
    );
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Deprecated: internal messaging removed in favor of email-only notifications
    return NextResponse.json(
      { error: 'Internal messaging has been removed. Please use email notifications.' },
      { status: 410 }
    );
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
