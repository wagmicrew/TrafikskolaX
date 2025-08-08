import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, newName } = body;

    if (!templateId || !newName) {
      return NextResponse.json(
        { error: 'Template ID and new name are required' },
        { status: 400 }
      );
    }

    // Update the template name (we'll use a custom field for display name)
    // For now, we'll update the triggerType description or add a displayName field
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set({
        // We'll add a displayName field to the schema later
        // For now, we'll store it in a custom way
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, templateId))
      .returning();

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Store the display name in site settings as a custom field
    await db.execute(
      `INSERT INTO site_settings (key, value, description, category) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [`email_template_${templateId}_name`, newName, `Display name for email template ${templateId}`, 'email_templates']
    );

    return NextResponse.json({
      success: true,
      message: 'Template name updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating template name:', error);
    return NextResponse.json(
      { error: 'Failed to update template name' },
      { status: 500 }
    );
  }
}

