import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailTemplates, emailReceivers, emailTriggers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all email templates with their receivers
    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.triggerType);

    // Get receivers for each template
    const templatesWithReceivers = await Promise.all(
      templates.map(async (template) => {
        const receivers = await db
          .select()
          .from(emailReceivers)
          .where(eq(emailReceivers.templateId, template.id));

        return {
          ...template,
          receivers: receivers.map(r => r.receiverType)
        };
      })
    );

    return NextResponse.json({ templates: templatesWithReceivers });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { triggerType, subject, htmlContent, receivers } = body;

    // Create email template
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values({
        triggerType,
        subject,
        htmlContent,
        isActive: true,
      })
      .returning();

    // Create receivers
    if (receivers && receivers.length > 0) {
      const receiverValues = receivers.map((receiverType: string) => ({
        templateId: newTemplate.id,
        receiverType,
      }));

      await db.insert(emailReceivers).values(receiverValues);
    }

    // Create trigger
    await db.insert(emailTriggers).values({
      templateId: newTemplate.id,
      triggerType,
      description: `Auto-generated trigger for ${triggerType}`,
      isActive: true,
    });

    return NextResponse.json({ 
      message: 'Email template created successfully',
      template: newTemplate 
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, subject, htmlContent, isActive, receivers } = body;

    // Update template
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set({
        subject,
        htmlContent,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, id))
      .returning();

    // Update receivers if provided
    if (receivers !== undefined) {
      // Delete existing receivers
      await db
        .delete(emailReceivers)
        .where(eq(emailReceivers.templateId, id));

      // Add new receivers
      if (receivers.length > 0) {
        const receiverValues = receivers.map((receiverType: string) => ({
          templateId: id,
          receiverType,
        }));

        await db.insert(emailReceivers).values(receiverValues);
      }
    }

    return NextResponse.json({ 
      message: 'Email template updated successfully',
      template: updatedTemplate 
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 });
  }
}
