import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function SwishApprovalsPage() {
  await requireAuth('admin');

  const pending = await db
    .select({
      id: bookings.id,
      scheduledDate: bookings.scheduledDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      totalPrice: bookings.totalPrice,
      userEmail: users.email,
      userName: users.firstName,
      lessonTypeName: lessonTypes.name,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
    .where(and(eq(bookings.paymentMethod, 'swish'), eq(bookings.paymentStatus, 'pending')));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Swishbetalningar att granska</h1>
      <div className="space-y-3">
        {pending.map(p => (
          <div key={p.id} className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{p.lessonTypeName || 'Körlektion'}</div>
              <div className="text-sm text-slate-300">{String(p.scheduledDate)} {String(p.startTime)}–{String(p.endTime)}</div>
              <div className="text-sm text-slate-300">{p.userName} ({p.userEmail})</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await fetch('/api/admin/bookings/approve-swish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: p.id, decision: 'confirm' }) });
                  location.reload();
                }}
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700"
              >Godkänn</button>
              <button
                onClick={async () => {
                  await fetch('/api/admin/bookings/approve-swish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: p.id, decision: 'deny' }) });
                  location.reload();
                }}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700"
              >Neka</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <div className="text-slate-300">Inga väntande Swishbetalningar.</div>
        )}
      </div>
    </div>
  );
}




