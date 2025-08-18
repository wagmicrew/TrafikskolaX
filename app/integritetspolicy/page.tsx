import { StaticNavigation } from "@/components/static-navigation"

export const dynamic = 'force-static'

export default function IntegritetspolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StaticNavigation />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Integritetspolicy</h1>
          <div className="prose prose-lg text-gray-700">
            <p className="mb-6">Vi värnar om din integritet. Här hittar du information om hur vi hanterar dina personuppgifter.</p>
            
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Fullständiga dokument</h2>
                <p className="mb-4">
                  För vår fullständiga integritetspolicy och köpvillkor, besök vår huvudsida:
                </p>
                <a 
                  href="/kopvillkor" 
                  className="inline-flex items-center text-sky-600 hover:text-sky-800 hover:underline font-medium"
                >
                  Läs våra fullständiga villkor och integritetspolicy
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Varför denna sida finns</h2>
                <p className="mb-4">
                  Denna sida finns tillgänglig för att tillgodose externa integreringar och plattformar som kräver en dedikerad URL för integritetspolicy.
                </p>
                <p>
                  Innehållet är identiskt med det som finns på vår huvudsida för <strong>köpvillkor och integritetspolicy</strong>.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Kontaktinformation</h3>
                <p className="text-gray-600">
                  Om du har frågor om vår integritetspolicy eller hur vi hanterar dina personuppgifter, tveka inte att kontakta oss.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

