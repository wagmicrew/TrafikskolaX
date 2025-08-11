import { requireAuth } from '@/lib/auth/server-auth'
import { db } from '@/lib/db'
import { bookingSteps, userFeedback } from '@/lib/db/schema'
import { asc, and, inArray, eq, desc } from 'drizzle-orm'
import ModuleClient from '../module-client'
import StudentHeader from '../../StudentHeader'
import { FaBookOpen } from 'react-icons/fa'

export const dynamic = 'force-dynamic'

export default async function ModulePage({ params }: { params: Promise<{ category: string }> }) {
  const auth = await requireAuth('student')
  const { category: rawCategory } = await params
  const category = decodeURIComponent(rawCategory)

  const steps = await db
    .select()
    .from(bookingSteps)
    .where(eq(bookingSteps.category, category))
    .orderBy(asc(bookingSteps.stepNumber))

  const keys = steps
    .map((s:any) => s.subcategory || s.description)
    .filter((k:any): k is string => Boolean(k))

  let feedbackRows: any[] = []
  if (keys.length > 0) {
    feedbackRows = await db
      .select()
      .from(userFeedback)
      .where(and(eq(userFeedback.userId, auth.id), inArray(userFeedback.stepIdentifier, keys)))
      .orderBy(desc(userFeedback.createdAt))
  }

  const feedbackByStep: Record<string, any[]> = {}
  for (const f of feedbackRows) {
    const key = f.stepIdentifier as string
    if (!feedbackByStep[key]) feedbackByStep[key] = []
    feedbackByStep[key].push(f)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="px-6 pt-8">
        <StudentHeader title={category} icon={<FaBookOpen className="text-sky-300" />} />
      </div>
      <ModuleClient category={category} steps={steps as any[]} feedbackByStep={feedbackByStep} />
    </div>
  )
}


