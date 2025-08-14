import { NextRequest, NextResponse } from 'next/server'
import { requireAuthAPI } from '@/lib/auth/server-auth'
import { qliroService } from '@/lib/payment/qliro-service'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin')
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { orderId } = await request.json()
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    const options = await qliroService.getPaymentOptions(orderId)
    // Compute a non-swish PaymentId suggestion
    const candidates: string[] = []
    const scan = (obj: any) => {
      if (!obj) return
      if (Array.isArray(obj)) { for (const it of obj) scan(it); return }
      if (typeof obj === 'object') {
        const name = String(obj.Name || obj.Method || obj.GroupName || '').toLowerCase()
        const id = obj.PaymentId || obj.Id || obj.PaymentID || null
        if (id && name && !name.includes('swish')) candidates.push(String(id))
        for (const k of Object.keys(obj)) scan(obj[k])
      }
    }
    scan(options)
    return NextResponse.json({ options, selectedNonSwishPaymentId: candidates[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch PaymentOptions' }, { status: 500 })
  }
}


