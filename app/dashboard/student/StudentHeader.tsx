"use client"

import React from 'react'
import Link from 'next/link'

export default function StudentHeader({ title, icon, rightSlot }: { title: string, icon?: React.ReactNode, rightSlot?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white shadow-2xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="text-2xl md:text-3xl font-extrabold">{title}</h1>
        </div>
        {rightSlot}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/dashboard/student" className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">Bokningar</Link>
        <Link href="/dashboard/student/feedback" className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">Feedback</Link>
        {/* Meddelanden link is conditionally rendered via client wrapper */}
        <MeddelandenLink />
        <Link href="/dashboard/settings" className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">Inställningar</Link>
      </div>
    </div>
  )
}

function MeddelandenLink() {
  const [enabled, setEnabled] = React.useState(true)
  React.useEffect(() => {
    fetch('/api/messages/unread-count')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setEnabled(data?.disabled !== true))
      .catch(() => setEnabled(true))
  }, [])
  if (!enabled) return null
  return <Link href="/dashboard/student/meddelande" className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">Meddelanden</Link>
}


