"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Database, Eye, UserCheck, Lock, Mail } from "lucide-react"
import { useEffect, useState } from "react"

export default function IntegritetspolicyPage() {
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
        const res = await fetch('/api/public/site-settings', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load site settings')
        const json = await res.json()
        if (mounted) setContact(json?.contact || null)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Fel vid hämtning av kontaktuppgifter')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])
  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Integritetspolicy
            </h1>
            <p className="text-xl text-gray-600">
              Din Trafikskola Hässleholm - Uppdaterad 2025-01-20
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Personuppgiftsansvarig:</strong> Din Trafikskola Hässleholm, Org.nr: 559123-4567
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Introduktion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  1. Introduktion och kontaktuppgifter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Vi på Din Trafikskola Hässleholm tar din integritet på största allvar och följer 
                  gällande dataskyddsförordning (GDPR). Denna integritetspolicy förklarar hur vi samlar in, 
                  använder och skyddar dina personuppgifter.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Personuppgiftsansvarig</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Företag:</strong> Din Trafikskola Hässleholm</p>
                    <p><strong>Organisationsnummer:</strong> 559123-4567</p>
                    <p><strong>Adress:</strong> Östergatan 3a, 281 43 Hässleholm</p>
                    <p><strong>E-post:</strong> {loading ? 'Laddar…' : (contact?.email || '—')}</p>
                    <p><strong>Telefon:</strong> {loading ? 'Laddar…' : (contact?.phone || '—')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vilka personuppgifter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  2. Vilka personuppgifter samlar vi in?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Grundläggande uppgifter</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Namn (för- och efternamn)</li>
                      <li>• E-postadress</li>
                      <li>• Telefonnummer</li>
                      <li>• Adress</li>
                      <li>• Födelsedatum</li>
                      <li>• Kön</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Utbildningsrelaterat</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Körkortstyp och kategori</li>
                      <li>• Tidigare körkortsinnehav</li>
                      <li>• Medicinska begränsningar (om relevanta)</li>
                      <li>• Slutbetyg och bedömningar</li>
                      <li>• Lektionshistorik</li>
                      <li>• Handledaruppgifter (temporärt krypterade)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Särskild hantering av känsliga uppgifter</h4>
                  <p className="text-yellow-700 text-sm">
                    Personnummer och andra känsliga uppgifter krypteras omedelbart och raderas automatiskt 
                    efter att de inte längre behövs för utbildningsändamål (max 30 dagar efter avslutad kurs).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Varför samlar vi in */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                  3. Varför samlar vi in dina uppgifter?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Rättslig grund: Avtalsuppfyllelse</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Genomföra körkortsutbildning</li>
                      <li>• Administrera bokningar och lektioner</li>
                      <li>• Hantera betalningar</li>
                      <li>• Utfärda intyg och certifikat</li>
                      <li>• Kommunicera om din utbildning</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Rättslig grund: Rättslig förpliktelse</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Rapportera till Transportstyrelsen</li>
                      <li>• Bokföring och redovisning</li>
                      <li>• Arkivering enligt branschkrav</li>
                      <li>• Säkerställa utbildningskvalitet</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Rättslig grund: Berättigat intresse</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Förbättra våra tjänster och utbildningskvalitet</li>
                    <li>• Analysera och förbättra vår webbplats</li>
                    <li>• Marknadsföring (endast med ditt samtycke)</li>
                    <li>• Säkerhetsövervakning av våra IT-system</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Hur länge sparar vi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-orange-600" />
                  4. Hur länge sparar vi dina uppgifter?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Aktiva kunder</h4>
                    <p className="text-sm text-green-700">
                      Under pågående utbildning och 2 år efter avslutad kurs för uppföljning.
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Bokföring</h4>
                    <p className="text-sm text-blue-700">
                      Bokföringsuppgifter sparas i 7 år enligt bokföringslagen.
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Känsliga uppgifter</h4>
                    <p className="text-sm text-red-700">
                      Personnummer raderas inom 30 dagar efter att de inte längre behövs.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Automatisk radering</h4>
                  <p className="text-sm">
                    Vårt system genomför automatisk radering av uppgifter enligt fastställda riktlinjer. 
                    Du kan när som helst begära att dina uppgifter raderas tidigare om det inte strider 
                    mot våra lagliga förpliktelser.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Vem delar vi med */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  5. Vem delar vi dina uppgifter med?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Myndigheter (vid lagkrav)</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• <strong>Transportstyrelsen</strong> - Utbildningsrapporter</li>
                      <li>• <strong>Skatteverket</strong> - Bokföringsuppgifter</li>
                      <li>• <strong>Polis/domstol</strong> - Vid brottsutredning</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Tekniska leverantörer</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• <strong>Hostingleverantör</strong> - EU-baserad server</li>
                      <li>• <strong>Betalningsleverantörer</strong> - Swish, Qliro</li>
                      <li>• <strong>E-posttjänst</strong> - För kommunikation</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">Viktigt att veta</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Vi säljer ALDRIG dina personuppgifter till tredje part</li>
                    <li>• Alla leverantörer har undertecknat databehandlingsavtal</li>
                    <li>• Vi överför inga uppgifter utanför EU/EES</li>
                    <li>• Delning sker endast när det är nödvändigt för tjänsten</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Dina rättigheter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-600" />
                  6. Dina rättigheter enligt GDPR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Grundläggande rättigheter</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>Rätt till information</strong> - Om hur vi behandlar dina uppgifter</li>
                      <li>• <strong>Rätt till tillgång</strong> - Få kopia av dina lagrade uppgifter</li>
                      <li>• <strong>Rätt till rättelse</strong> - Korrigera felaktiga uppgifter</li>
                      <li>• <strong>Rätt till radering</strong> - "Rätten att bli glömd"</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Ytterligare rättigheter</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>Rätt till begränsning</strong> - Begränsa behandlingen</li>
                      <li>• <strong>Rätt till dataportabilitet</strong> - Flytta dina uppgifter</li>
                      <li>• <strong>Rätt att invända</strong> - Mot behandling för berättigat intresse</li>
                      <li>• <strong>Rätt att klaga</strong> - Till Integritetsskyddsmyndigheten</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Så utövar du dina rättigheter</h4>
                  <p className="text-sm mb-2">
                    Kontakta oss på {loading ? 'Laddar…' : (contact?.email || '—')} eller ring {loading ? 'Laddar…' : (contact?.phone || '—')}. 
                    Vi svarar på din förfrågan inom 30 dagar.
                  </p>
                  <p className="text-sm">
                    <strong>Viktigt:</strong> Vi kan behöva verifiera din identitet innan vi behandlar din förfrågan.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Säkerhet och cookies */}
            <Card>
              <CardHeader>
                <CardTitle>7. Säkerhet och cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Säkerhetsåtgärder</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• HTTPS-kryptering för all datatransmission</li>
                      <li>• Säkra servrar inom EU</li>
                      <li>• Regelbundna säkerhetsuppdateringar</li>
                      <li>• Begränsad åtkomst till personuppgifter</li>
                      <li>• Automatisk kryptering av känsliga uppgifter</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Cookies och spårning</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• <strong>Nödvändiga cookies</strong> - För webbplatsens funktion</li>
                      <li>• <strong>Funktionscookies</strong> - Inloggning och språk</li>
                      <li>• <strong>Statistikcookies</strong> - Anonymiserad användning</li>
                      <li>• <strong>Inga marknadsföringscookies</strong> utan samtycke</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kontakt */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Frågor om integritet?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Kontakta oss</h4>
                    <p className="text-sm space-y-1">
                      <strong>E-post:</strong> {loading ? 'Laddar…' : (contact?.email || '—')}<br />
                      <strong>Telefon:</strong> {loading ? 'Laddar…' : (contact?.phone || '—')}<br />
                      <strong>Adress:</strong> Östergatan 3a, 281 43 Hässleholm<br />
                      <strong>Svarstid:</strong> Inom 30 dagar
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Klaga till myndighet</h4>
                    <p className="text-sm space-y-1">
                      <strong>Integritetsskyddsmyndigheten (IMY)</strong><br />
                      Box 8114, 104 20 Stockholm<br />
                      <strong>Telefon:</strong> 08-657 61 00<br />
                      <strong>Webb:</strong> imy.se
                    </p>
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

