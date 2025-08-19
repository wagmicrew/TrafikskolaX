import { NextResponse } from 'next/server'
import { getOpeningHours } from '@/lib/site-settings/opening-hours'

export async function GET() {
  try {
    const opening = await getOpeningHours()
    return NextResponse.json({ opening_hours: opening }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load opening hours' }, { status: 500 })
  }
}
