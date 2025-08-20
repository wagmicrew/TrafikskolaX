"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

type Step = {
  id: string
  category: string
  subcategory: string | null
  description: string | null
  stepNumber: number
}

type FeedbackMap = Record<string, { valuation: number, createdAt: string }>

function groupByCategory(steps: Step[]) {
  const map: Record<string, Step[]> = {}
  for (const s of steps) {
    const key = s.category || 'Övrigt'
    if (!map[key]) map[key] = []
    map[key].push(s)
  }
  for (const k of Object.keys(map)) {
    map[k].sort((a,b)=> (a.stepNumber||0)-(b.stepNumber||0))
  }
  return map
}

export default function LearningModules({ userId }: { userId: string }) {
  const [steps, setSteps] = useState<Step[]>([])
  const [feedback, setFeedback] = useState<FeedbackMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [stepsRes, fbRes] = await Promise.all([
          fetch('/api/booking-steps'),
          fetch('/api/user/feedback', { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')||''}` } })
        ])
        const stepsJson = await stepsRes.json()
        const fbJson = await fbRes.json()
        setSteps(stepsJson.steps || [])
        setFeedback(fbJson.feedback || {})
      } catch (e:any) {
        toast.error('Kunde inte ladda lärande-moduler')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const grouped = useMemo(()=> groupByCategory(steps), [steps])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <p className="text-slate-300">Laddar moduler...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(grouped).map(([category, items]) => {
        const total = items.length
        const completed = items.filter(it => {
          const key = it.subcategory || it.description || it.id
          const fb = feedback[key as string]
          return fb && fb.valuation >= 8
        }).length
        const percent = total>0 ? Math.round((completed/total)*100) : 0
        return (
          <div key={category} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{category}</div>
              <div className="text-sm text-slate-300">{percent}%</div>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-2 rounded-full bg-sky-400" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-xs text-slate-300">
              <span>Klarmarkerade: {completed}/{total}</span>
              <Link href={`/dashboard/student/learning/${encodeURIComponent(category)}`} className="inline-flex items-center justify-center rounded-md px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white">Öppna</Link>
            </div>
          </div>
        )
      })}
      {Object.keys(grouped).length===0 && (
        <div className="text-slate-300">Inga moduler tillgängliga ännu.</div>
      )}
    </div>
  )
}


