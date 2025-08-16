import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logging/logger'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(async ()=>({ raw: await req.text() }))
    logger.info('payment', 'Qliro order validate', { received: !!payload })
    // Accept all for now; real validation can be added if needed
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}


