"use client"

import React, { useMemo } from 'react'
import { FaStar } from 'react-icons/fa'

type Step = { id: string, subcategory: string|null, description: string|null, stepNumber: number }

function starsForValuation(valuation?: number) {
  // Map 0-10 scale to 1-3 stars
  const n = valuation === undefined || valuation === null ? 0 : valuation >= 8 ? 3 : valuation >= 4 ? 2 : 1
  return n
}

export default function ModuleClient({ category, steps, feedbackByStep }: { category: string, steps: Step[], feedbackByStep: Record<string, any[]> }) {
  const items = useMemo(()=> steps.map(s=> ({
    title: s.subcategory || s.description || 'Steg',
    step: s,
    feedback: feedbackByStep[(s.subcategory || s.description || '') as string] || []
  })), [steps, feedbackByStep])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6">
      <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white shadow-2xl mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">{category}</h1>
            <p className="text-slate-300">Planerade steg och feedback</p>
          </div>
          <a href="/dashboard/student" className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white">Tillbaka</a>
        </div>
      </div>

      <div className="space-y-4">
        {items.map(({ title, step, feedback }) => {
          const latest = feedback[0]
          const stars = latest ? starsForValuation(latest.valuation) : 0
          const starColor = stars >= 3 ? 'text-emerald-400' : stars === 2 ? 'text-yellow-400' : stars === 1 ? 'text-rose-400' : 'text-slate-500'
          const label = latest ? (latest.valuation >= 8 ? 'Utmärkt' : latest.valuation >= 4 ? 'Godkänd' : 'Behöver övning') : 'Ingen feedback ännu'
          return (
            <div key={step.id} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{title}</div>
                  {latest && (
                    <div className="text-xs text-slate-300 mt-0.5">Senaste omdöme: {label}</div>
                  )}
                </div>
                <div className={`flex items-center gap-1 ${starColor}`}>
                  {[0,1,2].map(i => (
                    <FaStar key={i} className={`${i < stars ? '' : 'opacity-30'}`} />
                  ))}
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {feedback.length>0 ? feedback.slice(0,5).map((f:any)=> (
                  <div key={f.id} className="rounded-lg bg-white/5 border border-white/10 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{f.isFromTeacher ? 'Lärare' : 'Du'}</div>
                      <div className="text-slate-300 text-xs">{new Date(f.createdAt).toLocaleDateString('sv-SE')}</div>
                    </div>
                    <div className="mt-1 text-slate-200">{f.feedbackText || '—'}</div>
                  </div>
                )) : (
                  <div className="text-slate-300">Ingen feedback ännu.</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


