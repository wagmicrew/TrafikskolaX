import { NextRequest, NextResponse } from 'next/server'
import { qliroService } from '@/lib/payment/qliro-service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId') || ''
    if (!orderId) {
      return new NextResponse('<!doctype html><html><body><pre>Missing orderId</pre></body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    const order = await qliroService.getOrder(orderId)
    const snippet = order?.OrderHtmlSnippet || ''
    if (!snippet) {
      return new NextResponse('<!doctype html><html><body><pre>No OrderHtmlSnippet returned</pre></body></html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    const html = `<!doctype html>
<html lang="sv">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Qliro Checkout</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #fff; font-family: -apple-system, system-ui, Segoe UI, Roboto, Arial, sans-serif; }
    </style>
    <script src="/qliro/q1ready.js" data-order-id=${JSON.stringify(orderId)}></script>
  </head>
  <body>
    ${snippet}
    <noscript class="fallback">Enable JavaScript to use Qliro Checkout</noscript>
  </body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Frame-Options': 'SAMEORIGIN' }
    })
  } catch (e: any) {
    const msg = e?.message || 'Internal error'
    return new NextResponse(`<!doctype html><html><body><pre>${msg}</pre></body></html>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
}


