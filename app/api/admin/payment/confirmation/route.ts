import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings, users, bookings, packagePurchases, packages, handledarBookings, handledarSessions, lessonTypes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/sendEmail';
import { createPaymentConfirmationTemplate } from '@/lib/email/templates/payment-confirmation-template';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

type PaymentType = 'booking' | 'package' | 'handledar';

interface PaymentInfo {
  amount: string;
  date: string;
  method: string;
  reference?: string;
  orderId?: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface PurchaseDetails {
  type: PaymentType;
  itemName: string;
  itemDescription?: string;
  date?: string;
  time?: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthAPI('admin');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      paymentType, // 'booking', 'package', 'handledar'
      itemId, // booking ID, package purchase ID, or handledar booking ID
      paymentInfo,
      sendEmail = true,
      notifySchool = true 
    } = body;

    if (!paymentType || !itemId || !paymentInfo) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'paymentType, itemId, and paymentInfo are required'
      }, { status: 400 });
    }

    // Validate payment type
    if (!['booking', 'package', 'handledar'].includes(paymentType)) {
      return NextResponse.json({ 
        error: 'Invalid payment type', 
        details: 'Payment type must be one of: booking, package, or handledar'
      }, { status: 400 });
    }

    // Handle different payment types
    let purchaseDetails: PurchaseDetails | undefined;
    let customerInfo: CustomerInfo | undefined;
    let itemName = '';
    let itemDescription = '';
    let itemDate;
    let itemTime;
    let updateResult;

    switch (paymentType as PaymentType) {
      case 'booking':
        // Get booking details
        const bookingResult = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, itemId))
          .limit(1);

        if (bookingResult.length === 0) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const booking = bookingResult[0];

        // Update booking payment status to 'paid'
        updateResult = await db
          .update(bookings)
          .set({ 
            paymentStatus: 'paid',
            updatedAt: new Date()
          })
          .where(eq(bookings.id, itemId));

        // Get customer info
        if (booking.isGuestBooking) {
          customerInfo = {
            firstName: booking.guestName?.split(' ')[0] || 'Guest',
            lastName: booking.guestName?.split(' ').slice(1).join(' ') || 'User',
            email: booking.guestEmail || ''
          };
        } else {
          const studentData = await db
            .select()
            .from(users)
            .where(eq(users.id, booking.userId as string))
            .limit(1);
          
          if (studentData.length === 0) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
          }
          
          customerInfo = studentData[0];
        }

        // Format the booking date and time
        itemDate = format(new Date(booking.scheduledDate), 'd MMMM yyyy', { locale: sv });
        itemTime = `${booking.startTime.slice(0, 5)} - ${booking.endTime.slice(0, 5)}`;

        // Get lesson type name
        try {
          const lessonTypeRows = await db
            .select()
            .from(lessonTypes)
            .where(eq(lessonTypes.id, booking.lessonTypeId as any))
            .limit(1);
          const lessonTypeResult = lessonTypeRows[0];
          itemName = (lessonTypeResult as any)?.name || 'Körlektion';
          itemDescription = (lessonTypeResult as any)?.description || '';
        } catch (error) {
          console.error('Error fetching lesson type:', error);
          itemName = 'Körlektion';
        }

        purchaseDetails = {
          type: 'booking',
          itemName,
          itemDescription,
          date: itemDate,
          time: itemTime
        };
        break;

      case 'package':
        // Get package purchase details
        const packagePurchaseResult = await db
          .select()
          .from(packagePurchases)
          .where(eq(packagePurchases.id, itemId))
          .limit(1);

        if (packagePurchaseResult.length === 0) {
          return NextResponse.json({ error: 'Package purchase not found' }, { status: 404 });
        }

        const packagePurchase = packagePurchaseResult[0];

        // Update package purchase payment status to 'paid'
        updateResult = await db
          .update(packagePurchases)
          .set({ paymentStatus: 'paid' })
          .where(eq(packagePurchases.id, itemId));

        // Get customer info
        const packageCustomerData = await db
          .select()
          .from(users)
          .where(eq(users.id, packagePurchase.userId))
          .limit(1);
        
        if (packageCustomerData.length === 0) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        
        customerInfo = packageCustomerData[0];

        // Get package name and description
        const packageData = await db
          .select()
          .from(packages)
          .where(eq(packages.id, packagePurchase.packageId))
          .limit(1);

        itemName = packageData.length > 0 ? packageData[0].name : 'Paket';
        itemDescription = packageData.length > 0 ? packageData[0].description || '' : '';
        
        purchaseDetails = {
          type: 'package',
          itemName,
          itemDescription
        };
        break;

      case 'handledar':
        // Get handledar booking details
        const handledarBookingResult = await db
          .select()
          .from(handledarBookings)
          .where(eq(handledarBookings.id, itemId))
          .limit(1);

        if (handledarBookingResult.length === 0) {
          return NextResponse.json({ error: 'Handledar booking not found' }, { status: 404 });
        }

        const handledarBooking = handledarBookingResult[0];

        // Update handledar booking payment status to 'paid'
        updateResult = await db
          .update(handledarBookings)
          .set({ paymentStatus: 'paid' })
          .where(eq(handledarBookings.id, itemId));

        // If studentId exists, get student info, otherwise use supervisor info
        if (handledarBooking.studentId) {
          const handledarStudentData = await db
            .select()
            .from(users)
            .where(eq(users.id, handledarBooking.studentId))
            .limit(1);
          
          if (handledarStudentData.length > 0) {
            customerInfo = handledarStudentData[0];
          } else {
            customerInfo = {
              firstName: handledarBooking.supervisorName?.split(' ')[0] || 'Supervisor',
              lastName: handledarBooking.supervisorName?.split(' ').slice(1).join(' ') || '',
              email: handledarBooking.supervisorEmail || ''
            };
          }
        } else {
          customerInfo = {
            firstName: handledarBooking.supervisorName?.split(' ')[0] || 'Supervisor',
            lastName: handledarBooking.supervisorName?.split(' ').slice(1).join(' ') || '',
            email: handledarBooking.supervisorEmail || ''
          };
        }

        // Get session details
        const sessionResult = await db
          .select()
          .from(handledarSessions)
          .where(eq(handledarSessions.id, handledarBooking.sessionId))
          .limit(1);

        if (sessionResult.length > 0) {
          const session = sessionResult[0];
          itemName = session.title || 'Handledarsession';
          itemDescription = session.description || '';
          itemDate = format(new Date(session.date), 'd MMMM yyyy', { locale: sv });
          itemTime = `${session.startTime.slice(0, 5)} - ${session.endTime.slice(0, 5)}`;
        } else {
          itemName = 'Handledarsession';
        }

        purchaseDetails = {
          type: 'handledar',
          itemName,
          itemDescription,
          date: itemDate,
          time: itemTime
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    // If sendEmail is true, send payment confirmation to customer
    if (sendEmail && customerInfo?.email) {
      // Get email settings from database
      const settingsRows = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.category, 'email'));

      const settings = settingsRows.reduce((acc, row) => {
        acc[row.key] = row.value || '';
        return acc;
      }, {} as Record<string, string>);

      // Get school contact info
      const contactSettingsRows = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, 'school_contact_email'));

      const schoolContactEmail = (contactSettingsRows.length > 0 ? 
        contactSettingsRows[0].value : 
        settings.from_email || 'noreply@dintrafikskolahlm.se') || 'noreply@dintrafikskolahlm.se';

      const schoolContactName = settings.school_contact_name || '';
      
      // Format payment date
      const paymentDate = paymentInfo.date || format(new Date(), 'd MMMM yyyy', { locale: sv });

      // Create email content
      const { htmlContent, textContent } = createPaymentConfirmationTemplate({
        recipientName: customerInfo.firstName,
        paymentDetails: {
          amount: paymentInfo.amount,
          date: paymentDate,
          method: paymentInfo.method,
          reference: paymentInfo.reference,
          orderId: paymentInfo.orderId
        },
        purchaseDetails: {
          type: (paymentType as PaymentType),
          itemName: purchaseDetails.itemName,
          itemDescription: purchaseDetails.itemDescription,
          date: purchaseDetails.date,
          time: purchaseDetails.time
        },
        schoolDetails: {
          name: settings.from_name || 'Din Trafikskola',
          contactEmail: schoolContactEmail,
          contactName: schoolContactName,
          phone: settings.school_phone || undefined
        }
      });

      // Send payment confirmation email
      await sendEmail(customerInfo.email, 'Betalningsbekräftelse', {
        title: 'Betalningsbekräftelse',
        body: htmlContent
      });
    }

    // If notifySchool is true, send notification to school contact email
    if (notifySchool && purchaseDetails) {
      // Get school notification settings
      const notifySettingsRows = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, 'notify_on_payment'));

      const shouldNotify = notifySettingsRows.length > 0 ? 
        notifySettingsRows[0].value === 'true' : 
        false;

      if (shouldNotify) {
        // Get school contact email
        const contactSettingsRows = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, 'school_contact_email'));

        if (contactSettingsRows.length > 0 && contactSettingsRows[0].value) {
          const schoolContactEmail = contactSettingsRows[0].value || 'noreply@dintrafikskolahlm.se';
          
          // Get email settings
          const settingsRows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.category, 'email'));

          const settings = settingsRows.reduce((acc, row) => {
            acc[row.key] = row.value || '';
            return acc;
          }, {} as Record<string, string>);

          // Send notification to school
          const notificationHtml = `
            <p>En ny betalning har registrerats.</p>
            <p><strong>Kund:</strong> ${customerInfo.firstName} ${customerInfo.lastName}</p>
            <p><strong>Belopp:</strong> ${paymentInfo.amount} kr</p>
            <p><strong>Typ:</strong> ${paymentType === 'booking' ? 'Bokning' : paymentType === 'package' ? 'Paket' : 'Handledarkurs'}</p>
            <p><strong>Produkt:</strong> ${purchaseDetails.itemName}</p>
            ${purchaseDetails.date ? `<p><strong>Datum:</strong> ${purchaseDetails.date}</p>` : ''}
            ${purchaseDetails.time ? `<p><strong>Tid:</strong> ${purchaseDetails.time}</p>` : ''}
            <p><em>Detta är ett automatiserat meddelande från bokningssystemet.</em></p>
          `;
          
          await sendEmail(schoolContactEmail, `Ny betalning: ${purchaseDetails.itemName}`, {
            title: 'Ny betalning registrerad',
            body: notificationHtml
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `${paymentType} payment confirmed successfully`,
      result: {
        id: itemId,
        paymentStatus: 'paid',
        emailSent: sendEmail,
        schoolNotified: notifySchool
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to confirm payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
