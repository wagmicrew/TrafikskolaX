import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siteSettings } from '@/lib/db/schema'

export async function GET() {
  try {
    const rows = await db.select().from(siteSettings)
    const map = rows.reduce((acc: Record<string, string>, r: any) => { acc[r.key] = r.value || '' ; return acc }, {} as Record<string, string>)
    return NextResponse.json({
      debug_extended_logs: map['debug_extended_logs'] === 'true',
      qliro_checkout_flow: map['qliro_checkout_flow'] || 'window',
      qliro_debug_logs: map['qliro_debug_logs'] === 'true',
      qliro_retry_attempts: map['qliro_retry_attempts'] || '3',
      qliro_cache_duration: map['qliro_cache_duration'] || '300'
    })
  } catch (e) {
    return NextResponse.json({ debug_extended_logs: false })
  }
}


