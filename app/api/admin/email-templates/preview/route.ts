import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function POST(request: Request) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId, htmlContent, subject, testData = {} } = await request.json();
    
    // If templateId is provided, use the existing template
    let template = null;
    if (templateId) {
      const templates = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, templateId))
        .limit(1);
      
      if (templates.length === 0) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      template = templates[0];
    } else if (htmlContent && subject) {
      // Use the provided content for preview
      template = { htmlContent, subject };
    } else {
      return NextResponse.json(
        { error: 'Either templateId or both htmlContent and subject are required' },
        { status: 400 }
      );
    }

    // Default test data for preview
    const defaultTestData = {
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://dintrafikskolahlm.se',
      schoolName: 'Din Trafikskola HLM',
      currentYear: new Date().getFullYear().toString(),
      user: {
        id: 'user123',
        email: 'elev@example.com',
        firstName: 'Kalle',
        lastName: 'Anka',
        phone: '070-123 45 67',
      },
      booking: {
        id: 'book123',
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:30',
        status: 'confirmed',
        paymentStatus: 'paid',
        totalPrice: '1200',
        lessonTypeName: 'Körlektion',
        teacherName: 'Kjell Ljung',
      },
      payment: {
        id: 'pay123',
        amount: '1200',
        currency: 'SEK',
        status: 'paid',
        method: 'swish',
        reference: '1234567890',
        paidAt: new Date().toISOString(),
      },
    };

    // Merge with provided test data
    const previewData = { ...defaultTestData, ...testData };

    // Process template with test data
    let previewHtml = template.htmlContent;
    let previewSubject = template.subject;

    // Flatten the preview data for easier replacement
    const flattenObject = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(acc, flattenObject(value, newKey));
        } else {
          acc[newKey] = String(value);
        }
        return acc;
      }, {} as Record<string, string>);
    };

    const flatData = flattenObject(previewData);

    // Replace placeholders in both HTML and subject
    Object.entries(flatData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      previewHtml = previewHtml.replace(regex, value);
      previewSubject = previewSubject.replace(regex, value);
    });

    return NextResponse.json({
      success: true,
      preview: {
        subject: previewSubject,
        html: previewHtml,
      },
      usedTestData: previewData, // Return the test data used for reference
    });
  } catch (error) {
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
}
