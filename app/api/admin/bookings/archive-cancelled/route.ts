import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bookings, lessonTypes } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { requireAuthAPI } from '@/lib/auth/server-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin')
    if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const { minutes = 15 } = await request.json().catch(() => ({}))
    const cutoff = new Date(Date.now() - Number(minutes) * 60 * 1000).toISOString()

    // Get target booking ids
    const idsResult = await db.execute(sql`
      SELECT id FROM bookings WHERE status = 'cancelled' AND updated_at < ${cutoff}
    `)
    const ids = (idsResult as any)?.rows?.map((r: any) => r.id) || []
    if (ids.length === 0) {
      return NextResponse.json({ success: true, archived: 0 })
    }

    let archived = 0
    for (const id of ids) {
      try {
        await db.execute(sql`
          INSERT INTO bookings_old (
            id, student_id, teacher_id, car_id, invoice_id,
            booking_date, duration, lesson_type, price, payment_status,
            notes, is_completed, is_cancelled, cancel_reason,
            created_at, updated_at
          )
          SELECT b.id, b.user_id, b.teacher_id, b.car_id, b.invoice_number,
                 (b.scheduled_date::timestamp + b.start_time), b.duration_minutes,
                 (CASE
                    WHEN lower(coalesce(lt.name, 'b')) LIKE '%b%' THEN 'b_license'
                    WHEN lower(coalesce(lt.name, '')) LIKE '%a%' THEN 'a_license'
                    WHEN lower(coalesce(lt.name, '')) LIKE '%taxi%' THEN 'taxi_license'
                    WHEN lower(coalesce(lt.name, '')) LIKE '%theory%' THEN 'theory'
                    ELSE 'assessment'
                  END)::lesson_type,
                 b.total_price::numeric,
                 (CASE
                    WHEN b.payment_status = 'paid' THEN 'paid'
                    WHEN b.payment_status = 'failed' THEN 'failed'
                    WHEN b.payment_status = 'refunded' THEN 'refunded'
                    ELSE 'pending'
                  END)::payment_status,
                 b.notes,
                 coalesce(b.is_completed, false),
                 true,
                 'manual archive (stale cancelled)',
                 b.created_at, b.updated_at
          FROM bookings b
          LEFT JOIN lesson_types lt ON lt.id = b.lesson_type_id
          WHERE b.id = ${id}
          ON CONFLICT (id) DO NOTHING
        `)
        await db.execute(sql`UPDATE internal_messages SET booking_id = NULL WHERE booking_id = ${id}`)
        await db.execute(sql`UPDATE payment_history SET booking_id = NULL WHERE booking_id = ${id}`)
        await db.execute(sql`DELETE FROM booking_plan_items WHERE booking_id = ${id}`)
        await db.execute(sql`DELETE FROM user_feedback WHERE booking_id = ${id}`)
        const del = await db.execute(sql`DELETE FROM bookings WHERE id = ${id} RETURNING id`)
        const removed = (del as any)?.rows?.length || 0
        archived += removed
      } catch (e) {
        console.error('Archive-cancelled failed for id', id, e)
      }
    }

    return NextResponse.json({ success: true, archived })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to archive cancelled' }, { status: 500 })
  }
}


