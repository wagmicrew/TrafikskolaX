"use client"

import { useEffect, useState } from "react"

export default function TermsOfService() {
  const [contact, setContact] = useState<{
    email: string
    phone: string
    website: string
    name: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/public/site-settings', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load site settings')
        const json = await res.json()
        if (mounted) setContact(json?.contact || null)
      } catch {
        // keep silent to avoid altering design; show placeholders below
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const websiteLabel = contact?.website
    ? contact.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : '—'

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Köpvillkor</h1>
      
      <div className="prose max-w-none">
        <h2>Allmänna villkor för Trafikskola X</h2>
        
        <h3>1. Betalningsvillkor</h3>
        <p>
          Betalning sker via våra godkända betalningsmetoder: Swish, kortbetalning eller faktura via Qliro.
          Betalning ska vara mottagen innan tjänsten tillhandahålls.
        </p>
        
        <h3>2. Avbokning och återbetalning</h3>
        <p>
          Avbokning kan göras senast 24 timmar före bokad tid för full återbetalning.
          Avbokning som sker senare kan medföra avgift.
        </p>
        
        <h3>3. Ansvar</h3>
        <p>
          Trafikskola X ansvarar för att utbildningen bedrivs enligt gällande föreskrifter.
          Eleven ansvarar för att följa instruktioner och vara förberedd för lektionerna.
        </p>
        
        <h3>4. Personuppgifter</h3>
        <p>
          Vi behandlar personuppgifter enligt gällande dataskyddsförordning (GDPR).
          Läs mer i vår integritetspolicy.
        </p>
        
        <h3>5. Tvister</h3>
        <p>
          Eventuella tvister ska i första hand lösas genom dialog.
          Vid tvist gäller svensk lag och svensk domstol.
        </p>
        
        <p className="mt-8 text-sm text-gray-600">
          Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
        </p>

        <hr className="my-6" />
        <h3>Kontakt</h3>
        <p className="text-sm">
          <strong>E-post:</strong> {loading ? 'Laddar…' : (contact?.email || '—')}<br />
          <strong>Telefon:</strong> {loading ? 'Laddar…' : (contact?.phone || '—')}<br />
          <strong>Hemsida:</strong> {loading ? 'Laddar…' : websiteLabel}
        </p>
      </div>
    </div>
  );
}