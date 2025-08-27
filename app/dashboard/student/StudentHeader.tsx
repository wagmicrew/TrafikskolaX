"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function StudentHeader({ title, icon, rightSlot }: { title: string, icon?: React.ReactNode, rightSlot?: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white shadow-2xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon}
          <h1 className="text-2xl md:text-3xl font-extrabold truncate">{title}</h1>
        </div>
        <div className="shrink-0">
          {rightSlot}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/dashboard/student" aria-current={pathname === '/dashboard/student' || pathname.startsWith('/dashboard/student/bokningar') ? 'page' : undefined} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">Bokningar</Link>
        <Link href="/dashboard/student/feedback" aria-current={pathname.startsWith('/dashboard/student/feedback') ? 'page' : undefined} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">Feedback</Link>
        {/* Meddelanden link disabled per request */}
        <Link href="/dashboard/settings" aria-current={pathname.startsWith('/dashboard/settings') ? 'page' : undefined} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">Inställningar</Link>
        <Link href="/dashboard/invoices" aria-current={pathname.startsWith('/dashboard/invoices') ? 'page' : undefined} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">Fakturor</Link>
      </div>
    </div>
  )
}

