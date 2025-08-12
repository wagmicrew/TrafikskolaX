import { db } from '@/lib/db'
import { bookingsOld, users } from '@/lib/db/schema'
import { eq, and, desc, like, sql } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/server-auth'

export const dynamic = 'force-dynamic'

export default async function ArchivedBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAuth('admin')
  const sp = await searchParams
  const page = Number(sp?.page || 1)
  const pageSize = 20
  const q = (sp?.q || '').trim()

  const where = q
    ? like(sql`lower(${bookingsOld.invoiceId} || ' ' || ${bookingsOld.notes})`, `%${q.toLowerCase()}%`)
    : undefined

  const rows = await db
    .select({
      id: bookingsOld.id,
      studentId: bookingsOld.studentId,
      teacherId: bookingsOld.teacherId,
      bookingDate: bookingsOld.bookingDate,
      duration: bookingsOld.duration,
      lessonType: bookingsOld.lessonType,
      price: bookingsOld.price,
      paymentStatus: bookingsOld.paymentStatus,
      isCancelled: bookingsOld.isCancelled,
      cancelReason: bookingsOld.cancelReason,
      createdAt: bookingsOld.createdAt,
      updatedAt: bookingsOld.updatedAt,
    })
    .from(bookingsOld)
    .where(where as any)
    .orderBy(desc(bookingsOld.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const countRows = await db.select({ count: sql`count(*)` }).from(bookingsOld).where(where as any)
  const total = Number(countRows[0]?.count || 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Arkiverade bokningar</h1>
        <form className="flex gap-2" action="/dashboard/admin/bookings-old" method="get">
          <input name="q" defaultValue={q} className="px-3 py-2 rounded bg-white/10 border border-white/20" placeholder="Sök..." />
          <button className="px-3 py-2 rounded bg-white/10 border border-white/20 hover:bg-white/20">Sök</button>
        </form>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr className="border-b border-white/10">
              <th className="p-3">Datum</th>
              <th className="p-3">Lektion</th>
              <th className="p-3">Pris</th>
              <th className="p-3">Betalning</th>
              <th className="p-3">Status</th>
              <th className="p-3">Anledning</th>
              <th className="p-3">Skapad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/10">
                <td className="p-3">{new Date(r.bookingDate as any).toLocaleString('sv-SE')}</td>
                <td className="p-3">{r.lessonType}</td>
                <td className="p-3">{r.price}</td>
                <td className="p-3">{r.paymentStatus}</td>
                <td className="p-3">{r.isCancelled ? 'Avbruten' : ''}</td>
                <td className="p-3">{r.cancelReason || ''}</td>
                <td className="p-3">{new Date(r.createdAt as any).toLocaleString('sv-SE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 justify-center mt-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map(p => (
          <a key={p} href={`?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={`px-3 py-1 rounded border ${p === page ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}>{p}</a>
        ))}
      </div>
    </div>
  )
}


