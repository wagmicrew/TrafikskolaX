"use client"

import React, { useEffect, useMemo, useState } from 'react'

type FB = { stepIdentifier: string, valuation: number, feedbackText: string|null, createdAt: string }

export default function StudentStrengthsCard() {
  const [feedback, setFeedback] = useState<FB[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/user/feedback', { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')||''}` } })
        const data = await res.json()
        // Flatten latest feedback per step
        const map = data.feedback || {}
        const arr: FB[] = Object.keys(map).map(k => map[k])
        setFeedback(arr)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const strengths = useMemo(() => feedback
    .filter(f => f.valuation >= 8)
    .sort((a,b)=> b.valuation - a.valuation)
    .slice(0,5), [feedback])

  const needsWork = useMemo(() => feedback
    .filter(f => f.valuation <= 3)
    .sort((a,b)=> a.valuation - b.valuation)
    .slice(0,5), [feedback])

  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white">
      <h3 className="text-xl font-extrabold mb-4">Styrkor & Behöver övning</h3>
      {loading ? (
        <div className="text-slate-300">Laddar...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="font-semibold mb-2 text-emerald-300">Styrkor</div>
            <div className="space-y-2">
              {strengths.length>0 ? strengths.map((f, idx) => (
                <div key={idx} className="text-sm flex items-center justify-between">
                  <span className="truncate pr-2">{f.stepIdentifier}</span>
                  <span className="text-emerald-300 font-semibold">{f.valuation}/10</span>
                </div>
              )) : <div className="text-slate-300">Ingen data än</div>}
            </div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="font-semibold mb-2 text-rose-300">Behöver övning</div>
            <div className="space-y-2">
              {needsWork.length>0 ? needsWork.map((f, idx) => (
                <div key={idx} className="text-sm flex items-center justify-between">
                  <span className="truncate pr-2">{f.stepIdentifier}</span>
                  <span className="text-rose-300 font-semibold">{f.valuation}/10</span>
                </div>
              )) : <div className="text-slate-300">Ingen data än</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



