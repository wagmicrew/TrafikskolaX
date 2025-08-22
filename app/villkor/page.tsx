"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CreditCard, RefreshCw, Scale, AlertTriangle, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import OpeningHoursDynamic from "@/components/site/opening-hours-dynamic"

export default function TermsPage() {
  const [contact, setContact] = useState<{
    email: string
    phone: string
    website: string
    name: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/public/site-settings", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load site settings")
        const json = await res.json()
        if (mounted) setContact(json?.contact || null)
      } catch (e: any) {
        if (mounted) setError(e?.message || "Fel vid hämtning av kontaktuppgifter")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const displayWebsite = (url?: string) => {
    if (!url) return ""
    try {
      return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    } catch {
      return url
    }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Allmänna villkor
            </h1>
            <p className="text-xl text-gray-600">
              Din Trafikskola Hässleholm - Uppdaterat 2025-01-20
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Organisationsnummer:</strong> 559123-4567 | <strong>F-skattsedel:</strong> Ja
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Allmänt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  1. Allmänna bestämmelser
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Dessa allmänna villkor gäller för alla tjänster som tillhandahålls av Din Trafikskola Hässleholm, 
                  org.nr 559123-4567, med adress Östergatan 3a, 281 43 Hässleholm.
                </p>
                <p>
                  Genom att boka våra tjänster accepterar du dessa villkor i sin helhet. Vi förbehåller oss rätten 
                  att ändra villkoren med 30 dagars varsel.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Våra tjänster omfattar:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Körkortsutbildning för B-körkort (personbil)</li>
                    <li>Handledarutbildning</li>
                    <li>Riskettan (riskutbildning)</li>
                    <li>Teorilektioner och övningskörning</li>
                    <li>Bedömningslektioner och uppkörningsförberedelser</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Betalningsvillkor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  2. Betalningsvillkor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Betalningsmetoder</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span><strong>Swish:</strong> Direktbetalning vid bokning</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span><strong>Qliro:</strong> Kort- och fakturabetalning</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span><strong>Krediter:</strong> Förbetalda lektionskrediter</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span><strong>Senare betalning:</strong> För inskrivna studenter (max 2 obetalda)</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Betalningsvillkor</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Betalning ska ske vid bokningstillfället</li>
                      <li>• Faktura betalas inom 30 dagar</li>
                      <li>• Dröjsmålsränta: 2% per påbörjad månad</li>
                      <li>• Inkassoavgift enligt lag tillkommer</li>
                      <li>• Alla priser inkluderar moms (25%)</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Viktigt om betalning</h4>
                  <p className="text-yellow-700 text-sm">
                    Vid Swish-betalning använd alltid det order-ID som visas i meddelandet. 
                    Detta säkerställer att din betalning kopplas korrekt till din bokning.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Avbokning och återbetalning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-orange-600" />
                  3. Avbokning och återbetalning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">Kostnadsfri avbokning</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>Mer än 24 timmar:</strong> Full återbetalning</li>
                      <li>• <strong>Vid sjukdom:</strong> Läkarintyg krävs (kostnadsfritt)</li>
                      <li>• <strong>Tekniska problem:</strong> På vår sida (full återbetalning)</li>
                      <li>• <strong>Lärare sjuk:</strong> Ombokning eller återbetalning</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">Avgiftsbelagd avbokning</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>12-24 timmar:</strong> 50% av lektionsavgiften</li>
                      <li>• <strong>Mindre än 12 timmar:</strong> 75% av lektionsavgiften</li>
                      <li>• <strong>Uteblivande:</strong> Ingen återbetalning</li>
                      <li>• <strong>Sen ankomst:</strong> Lektionen förkortas, full avgift</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Återbetalningsprocess</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Återbetalning sker inom 5-10 arbetsdagar</li>
                    <li>• Swish-betalningar återbetalas via Swish</li>
                    <li>• Kortbetalningar återbetalas till samma kort</li>
                    <li>• Krediter återställs automatiskt vid godkänd avbokning</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Avgifter och tilläggskostnader */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  4. Avgifter och tilläggskostnader
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Administrativa avgifter</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>Bokningsavgift:</strong> 0 kr (inkluderat)</li>
                      <li>• <strong>Ombokningsavgift:</strong> 0 kr (vid mer än 24h varsel)</li>
                      <li>• <strong>Avbokningsavgift:</strong> Enligt avbokningsvillkor</li>
                      <li>• <strong>Inkassoavgift:</strong> Enligt gällande lagstiftning</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Tillkommande kostnader</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>Kurstillägg:</strong> Ej tillämpligt</li>
                      <li>• <strong>Materialavgift:</strong> Ingår i grundpriset</li>
                      <li>• <strong>Expeditionsavgift:</strong> 0 kr</li>
                      <li>• <strong>Betalningsavgift:</strong> 0 kr för alla betalningsmetoder</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Transparenta priser</h4>
                  <p className="text-green-700 text-sm">
                    Alla våra priser är alltid angivna inklusive moms och alla avgifter. 
                    Det pris du ser vid bokning är det pris du betalar - inga dolda kostnader.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reklamation och tvist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-purple-600" />
                  5. Reklamation och tvistlösning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Reklamationsrätt</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>Reklamationstid:</strong> 3 år från köpdatum</li>
                      <li>• <strong>Anmälan:</strong> Inom skälig tid efter upptäckt</li>
                      <li>• <strong>Kontakt:</strong> {loading ? 'Laddar…' : (contact?.email || '—')}</li>
                      <li>• <strong>Telefon:</strong> {loading ? 'Laddar…' : (contact?.phone || '—')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Tvistlösning</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>Primärt:</strong> Dialog och förhandling</li>
                      <li>• <strong>Medling:</strong> Via branschorganisation</li>
                      <li>• <strong>ARN:</strong> Allmänna reklamationsnämnden</li>
                      <li>• <strong>Domstol:</strong> Hässleholms tingsrätt</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Vår service-garanti</h4>
                  <p className="text-sm mb-2">
                    Vi strävar efter att alla kunder ska vara nöjda med våra tjänster. Vid klagomål:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Vi svarar inom 24 timmar på arbetsdagar</li>
                    <li>• Vi utreder alla klagomål noggrant</li>
                    <li>• Vi erbjuder kompensation vid vårt fel</li>
                    <li>• Vi följer upp att problem åtgärdas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Ansvar och begränsningar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  6. Ansvar och begränsningar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Vårt ansvar</h4>
                    <p className="text-sm text-gray-700">
                      Vi ansvarar för att utföra avtalade tjänster professionellt och enligt gällande bestämmelser. 
                      Vårt ansvar är begränsat till direkt skada som orsakats av grov vårdslöshet från vår sida.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Ansvarsbegränsning</h4>
                    <p className="text-sm text-gray-700">
                      Vi ansvarar inte för indirekta skador, utebliven vinst eller följdskador. 
                      Vårt totala ansvar är begränsat till beloppet för den aktuella tjänsten.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Force majeure</h4>
                    <p className="text-sm text-gray-700">
                      Vi ansvarar inte för förseningar eller hinder som beror på omständigheter utanför vår kontroll, 
                      såsom extremt väder, trafikstörningar, sjukdom eller myndighetsbeslut.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kontaktinformation */}
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800">Kontakta oss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Din Trafikskola Hässleholm</h4>
                    <p className="text-sm space-y-1">
                      Östergatan 3a<br />
                      281 43 Hässleholm<br />
                      <strong>Org.nr:</strong> 559123-4567<br />
                      <strong>F-skatt:</strong> Ja
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Kontaktuppgifter</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>E-post:</strong> {loading ? 'Laddar…' : (contact?.email || '—')}</div>
                      <div><strong>Telefon:</strong> {loading ? 'Laddar…' : (contact?.phone || '—')}</div>
                      <div><strong>Hemsida:</strong> {loading ? 'Laddar…' : (displayWebsite(contact?.website) || '—')}</div>
                      <div>
                        <strong>Öppettider:</strong>
                        <div className="mt-1">
                          <OpeningHoursDynamic scope="office" showSectionTitles={false} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

