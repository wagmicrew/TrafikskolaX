import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { emailTemplates, emailReceivers, emailTriggers, siteSettings } from '@/lib/db/schema';
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

    // Get schoolname and school phone from site settings
    const schoolnameSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'schoolname'))
      .limit(1);

    const schoolPhoneSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'school_phonenumber'))
      .limit(1);

    const schoolname = schoolnameSetting.length > 0 ? schoolnameSetting[0].value : 'Din Trafikskola Hässleholm';
    const schoolPhone = schoolPhoneSetting.length > 0 ? schoolPhoneSetting[0].value : '08-XXX XX XX';

    return NextResponse.json({ 
      templates: templatesWithReceivers,
      schoolname,
      schoolPhone
    });
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

    // Ensure enum value exists in DB for provided triggerType
    if (typeof triggerType !== 'string' || triggerType.trim() === '') {
      return NextResponse.json({ error: 'Invalid triggerType' }, { status: 400 });
    }
    try {
      const existing = await db.execute(sql`
        SELECT e.enumlabel
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'email_trigger_type'
      `);
      const labels: string[] = ((existing as any).rows?.map((r: any) => r.enumlabel))
        ?? (Array.isArray(existing) ? (existing as any).map((r: any) => r.enumlabel) : []);
      if (!labels.includes(triggerType)) {
        const escaped = triggerType.replace(/'/g, "''");
        await db.execute(sql.raw(`ALTER TYPE email_trigger_type ADD VALUE IF NOT EXISTS '${escaped}'`));
      }
    } catch (e) {
      console.error('Failed ensuring enum email_trigger_type value:', e);
    }

    // Check if template already exists
    const existingTemplate = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.triggerType, triggerType))
      .limit(1);

    let template;
    
    if (existingTemplate.length > 0) {
      // Update existing template
      const [updatedTemplate] = await db
        .update(emailTemplates)
        .set({
          subject,
          htmlContent,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.triggerType, triggerType))
        .returning();
      
      template = updatedTemplate;
      
      // Update receivers - delete existing and recreate
      await db
        .delete(emailReceivers)
        .where(eq(emailReceivers.templateId, template.id));
    } else {
      // Create new template
      const [newTemplate] = await db
        .insert(emailTemplates)
        .values({
          triggerType,
          subject,
          htmlContent,
          isActive: true,
        })
        .returning();
      
      template = newTemplate;
      
      // Create trigger (only for new templates)
      await db.insert(emailTriggers).values({
        templateId: template.id,
        triggerType,
        description: `Auto-generated trigger for ${triggerType}`,
        isActive: true,
      });
    }

    // Create/recreate receivers
    if (receivers && receivers.length > 0) {
      const receiverValues = receivers.map((receiverType: string) => ({
        templateId: template.id,
        receiverType,
      }));

      await db.insert(emailReceivers).values(receiverValues);
    }

    return NextResponse.json({ 
      message: existingTemplate.length > 0 ? 'Email template updated successfully' : 'Email template created successfully',
      template 
    });
  } catch (error) {
    console.error('Error creating/updating email template:', error);
    return NextResponse.json({ error: 'Failed to create/update email template' }, { status: 500 });
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
