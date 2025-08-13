import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handledarBookings, siteSettings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/email/email-service';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId krävs' }, { status: 400 });

    const rows = await db.select().from(handledarBookings).where(eq(handledarBookings.id, bookingId)).limit(1);
    if (rows.length === 0) return NextResponse.json({ error: 'Booking saknas' }, { status: 404 });
    const booking = rows[0] as any;

    // Build signed admin approve/deny links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret';
    const approveToken = jwt.sign({ type: 'swish_action', bookingId, sessionType: 'handledar', decision: 'confirm' }, jwtSecret, { expiresIn: '30m' });
    const denyToken = jwt.sign({ type: 'swish_action', bookingId, sessionType: 'handledar', decision: 'deny' }, jwtSecret, { expiresIn: '30m' });
    const adminApproveUrl = `${baseUrl}/api/admin/swish/email-action?token=${encodeURIComponent(approveToken)}`;
    const adminDenyUrl = `${baseUrl}/api/admin/swish/email-action?token=${encodeURIComponent(denyToken)}`;

    // Try to resolve user details for context
    let userDetails: any = null;
    if (booking.studentId) {
      const u = await db.select().from(users).where(eq(users.id, booking.studentId)).limit(1);
      if (u.length > 0) userDetails = u[0];
    }

    const emailContext = {
      user: userDetails ? {
        id: userDetails.id,
        email: userDetails.email,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        role: userDetails.role
      } : {
        id: '',
        email: booking.supervisorEmail || 'School',
        firstName: booking.supervisorName?.split(' ')[0] || 'School',
        lastName: booking.supervisorName?.split(' ').slice(1).join(' ') || '',
        role: 'school'
      },
      booking: {
        id: booking.id,
        scheduledDate: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        lessonTypeName: 'Handledarutbildning',
        totalPrice: booking.price?.toString() || '0',
        swishUUID: booking.swishUuid,
        paymentMethod: 'swish'
      },
      customData: {
        adminApproveUrl,
        adminDenyUrl,
        adminActionButtons: `
          <div style="text-align:center;margin:24px 0;">
            <a href="${adminApproveUrl}" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700;margin-right:8px;">Bekräfta betalning</a>
            <a href="${adminDenyUrl}" style="background:#dc2626;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700;">Ingen betalning mottagen</a>
          </div>`
      }
    } as any;

    const ok = await EmailService.sendTriggeredEmail('swish_payment_verification', {
      ...emailContext,
      customData: {
        ...emailContext.customData,
        links: {
          adminModerationUrl: `${baseUrl}/betalning/swish/moderera?token=${encodeURIComponent(approveToken)}`
        }
      }
    } as any);
    if (!ok) {
      // Treat partial delivery as success for UX; advise configuring school email
      return NextResponse.json({ success: true, warning: 'E-post delvis skickad. Kontrollera mottagare (admin/school) och e-postinställningar.' });
    }

    return NextResponse.json({ success: true, delivered: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internt fel' }, { status: 500 });
  }
}


