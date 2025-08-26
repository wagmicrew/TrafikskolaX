import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siteSettings } from '@/lib/db/schema'
import { withDefaults } from '@/lib/site-settings/opening-hours'

export async function GET() {
  try {
    const rows = await db.select().from(siteSettings)
    const map = rows.reduce((acc: Record<string, string>, r: any) => { acc[r.key] = r.value || '' ; return acc }, {} as Record<string, string>)

    // Parse opening hours with safe defaults
    let opening_hours: any = undefined
    try {
      opening_hours = withDefaults(map['opening_hours'] ? JSON.parse(map['opening_hours']) : null)
    } catch {
      opening_hours = withDefaults(null)
    }

    // Contact details
    const contact = {
      email: map['school_email'] || map['reply_to'] || map['from_email'] || '',
      phone: map['school_phonenumber'] || '',
      website: map['public_app_url'] || map['site_domain'] || '',
      name: map['schoolname'] || map['site_name'] || ''
    }

    return NextResponse.json({
      debug_extended_logs: map['debug_extended_logs'] === 'true',
      qliro_checkout_flow: map['qliro_checkout_flow'] || 'window',
      qliro_debug_logs: map['qliro_debug_logs'] === 'true',
      qliro_retry_attempts: map['qliro_retry_attempts'] || '3',
      qliro_cache_duration: map['qliro_cache_duration'] || '300',
      contact,
      opening_hours,
      site_name: map['site_name'] || '',
      schoolname: map['schoolname'] || '',
      // Social media links for footer
      social_facebook: map['social_facebook'] || '',
      social_instagram: map['social_instagram'] || '',
      social_tiktok: map['social_tiktok'] || '',
      // Payment settings
      swish_phone: map['swish_phone'] || map['school_phonenumber'] || ''
    })
  } catch (e) {
    return NextResponse.json({ debug_extended_logs: false })
  }
}


