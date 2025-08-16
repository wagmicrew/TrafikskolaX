import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logging/logger'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    logger.info('payment', 'Qliro order-management status push', { bodyLength: body.length })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}


