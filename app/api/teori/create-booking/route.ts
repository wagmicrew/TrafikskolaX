import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teoriBookings, teoriSupervisors, teoriSessions, teoriLessonTypes, qliroOrders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { TeoriService } from '@/lib/payment/teori-service';

interface SupervisorInfo {
  name: string;
  email: string;
  phone: string;
  personalNumber?: string;
}

interface CreateBookingRequest {
  sessionId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  supervisors?: SupervisorInfo[];
  participantInfo?: {
    name: string;
    email: string;
    phone: string;
    personalNumber?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateBookingRequest = await request.json();
    const { sessionId, customerInfo, supervisors = [], participantInfo } = body;

    // Validate required fields
    if (!sessionId || !customerInfo?.firstName || !customerInfo?.lastName || !customerInfo?.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get session details with lesson type
    const sessionData = await db
      .select({
        session: teoriSessions,
        lessonType: teoriLessonTypes
      })
      .from(teoriSessions)
      .innerJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
      .where(eq(teoriSessions.id, sessionId))
      .limit(1);

    if (sessionData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const { session, lessonType } = sessionData[0];

    // Check availability
    if (session.currentParticipants >= session.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Session is fully booked' },
        { status: 400 }
      );
    }

    // Calculate pricing
    const basePrice = parseFloat(session.price || lessonType.price);
    const supervisorPrice = lessonType.pricePerSupervisor ? parseFloat(lessonType.pricePerSupervisor) : 0;
    const totalSupervisorPrice = supervisorPrice * supervisors.length;
    const totalPrice = basePrice + totalSupervisorPrice;

    // Create booking
    const bookingResult = await db
      .insert(teoriBookings)
      .values({
        sessionId: sessionId,
        studentId: customerInfo.email, // Temporary - should be actual user ID
        status: 'pending',
        price: totalPrice.toString(),
        paymentStatus: 'pending',
        participantName: participantInfo?.name || `${customerInfo.firstName} ${customerInfo.lastName}`,
        participantEmail: participantInfo?.email || customerInfo.email,
        participantPhone: participantInfo?.phone || customerInfo.phone,
        participantPersonalNumber: participantInfo?.personalNumber,
      })
      .returning();

    const booking = bookingResult[0];

    // Add supervisors if any
    if (supervisors.length > 0 && lessonType.allowsSupervisors) {
      const supervisorInserts = supervisors.map(supervisor => ({
        teoriBookingId: booking.id,
        supervisorName: supervisor.name,
        supervisorEmail: supervisor.email,
        supervisorPhone: supervisor.phone,
        supervisorPersonalNumber: supervisor.personalNumber,
        price: supervisorPrice.toString(),
      }));

      await db.insert(teoriSupervisors).values(supervisorInserts);
    }

    // Update session participant count
    await db
      .update(teoriSessions)
      .set({
        currentParticipants: session.currentParticipants + 1,
        updatedAt: new Date()
      })
      .where(eq(teoriSessions.id, sessionId));

    // Create Teori payment checkout
    try {
      const teoriService = new TeoriService();
      
      const checkoutData = {
        amount: Math.round(totalPrice * 100), // Convert to öre
        currency: 'SEK',
        merchantReference: `TEORI-${booking.id.substring(0, 8)}`,
        customer: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        orderLines: [
          {
            name: `${lessonType.name} - ${session.title}`,
            quantity: 1,
            unitPrice: Math.round(basePrice * 100),
            totalPrice: Math.round(basePrice * 100)
          },
          ...supervisors.map((supervisor, index) => ({
            name: `Handledare: ${supervisor.name}`,
            quantity: 1,
            unitPrice: Math.round(supervisorPrice * 100),
            totalPrice: Math.round(supervisorPrice * 100)
          }))
        ],
        callbackToken: teoriService.generateCallbackToken(),
        metadata: {
          bookingId: booking.id,
          sessionId: sessionId,
          bookingType: 'teori'
        }
      };

      const checkoutResult = await teoriService.createCheckout(checkoutData);

      if (checkoutResult.success && checkoutResult.data) {
        // Store order reference
        await db.insert(qliroOrders).values({
          orderId: checkoutResult.data.orderId,
          merchantReference: checkoutData.merchantReference,
          amount: totalPrice.toString(),
          currency: 'SEK',
          status: 'pending',
          paymentType: 'teori',
          teoriBookingId: booking.id,
          callbackToken: checkoutData.callbackToken,
        });

        return NextResponse.json({
          success: true,
          booking: {
            id: booking.id,
            sessionId: booking.sessionId,
            totalPrice: totalPrice,
            supervisorCount: supervisors.length,
            status: booking.status,
            paymentStatus: booking.paymentStatus
          },
          checkout: {
            orderId: checkoutResult.data.orderId,
            checkoutUrl: checkoutResult.data.checkoutUrl,
            snippetUrl: checkoutResult.data.snippetUrl
          }
        });
      } else {
        // Payment creation failed, but booking was created
        return NextResponse.json({
          success: true,
          booking: {
            id: booking.id,
            sessionId: booking.sessionId,
            totalPrice: totalPrice,
            supervisorCount: supervisors.length,
            status: booking.status,
            paymentStatus: booking.paymentStatus
          },
          checkout: null,
          warning: 'Booking created but payment checkout failed. Please contact support.'
        });
      }

    } catch (paymentError) {
      console.error('Payment creation error:', paymentError);
      
      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          sessionId: booking.sessionId,
          totalPrice: totalPrice,
          supervisorCount: supervisors.length,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        },
        checkout: null,
        warning: 'Booking created but payment setup failed. Please contact support.'
      });
    }

  } catch (error) {
    console.error('Error creating Teori booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
