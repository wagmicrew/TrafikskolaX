import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailTemplates, emailReceivers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, params.id))
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get receivers for this template
    const receivers = await db
      .select()
      .from(emailReceivers)
      .where(eq(emailReceivers.templateId, params.id));

    return NextResponse.json({
      ...template[0],
      receivers: receivers.map(r => r.receiverType)
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json({ error: 'Failed to fetch email template' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, htmlContent, isActive, receivers } = body;

    // Check if template exists
    const existingTemplate = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, params.id))
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Update template
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set({
        subject,
        htmlContent,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, params.id))
      .returning();

    // Update receivers if provided
    if (receivers !== undefined) {
      // Delete existing receivers
      await db
        .delete(emailReceivers)
        .where(eq(emailReceivers.templateId, params.id));

      // Add new receivers
      if (receivers.length > 0) {
        const receiverValues = receivers.map((receiverType: string) => ({
          templateId: params.id,
          receiverType,
        }));

        await db.insert(emailReceivers).values(receiverValues);
      }
    }

    return NextResponse.json({ 
      ...updatedTemplate,
      receivers: receivers || []
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete receivers first (foreign key constraint)
    await db
      .delete(emailReceivers)
      .where(eq(emailReceivers.templateId, params.id));

    // Delete template
    const deletedTemplate = await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, params.id))
      .returning();

    if (deletedTemplate.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    return NextResponse.json({ error: 'Failed to delete email template' }, { status: 500 });
  }
}
