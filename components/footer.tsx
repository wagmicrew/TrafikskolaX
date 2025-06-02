import Link from "next/link"
import { Phone, Mail, Clock } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Om Din Trafikskola</h3>
            <p className="text-gray-600 mb-4">
              Hässleholms nyaste trafikskola med fokus på kvalitet och personlig service. Vi erbjuder utbildning för
              B-körkort i en trygg och modern miljö.
            </p>
            <div className="flex items-center">
              <img src="/images/din-logo-small.png" alt="Din Trafikskola" className="h-12" />
            </div>
          </div>

          {/* Column 2: Contact */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Kontakta oss</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Phone className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Telefon</p>
                  <a href="tel:0760389192" className="text-red-600 hover:text-red-700">
                    0760-389192
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <Mail className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">E-post</p>
                  <a href="mailto:info@dintrafikskolahlm.se" className="text-red-600 hover:text-red-700">
                    info@dintrafikskolahlm.se
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-red-600 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium">Adress</p>
                  <p className="text-gray-600">Östergatan 3a, 281 30 Hässleholm</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Opening Hours */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Öppettider</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Clock className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-gray-600">Måndag - Fredag: 08:00 - 18:00</span>
              </li>
              <li className="flex items-center">
                <Clock className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-gray-600">Lördag: 10:00 - 14:00</span>
              </li>
              <li className="flex items-center">
                <Clock className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-gray-600">Söndag: Stängt</span>
              </li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-4">Körlektioner</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Clock className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-gray-600">Måndag - Fredag: 08:00 - 20:00</span>
              </li>
              <li className="flex items-center">
                <Clock className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-gray-600">Lördag: 10:00 - 16:00</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Quick Links & Admin */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Snabblänkar</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/om-oss" className="text-red-600 hover:text-red-700">
                  Om oss
                </Link>
              </li>
              <li>
                <Link href="/vara-tjanster" className="text-red-600 hover:text-red-700">
                  Våra tjänster
                </Link>
              </li>
              <li>
                <Link href="/boka-korning" className="text-red-600 hover:text-red-700">
                  Boka körlektion
                </Link>
              </li>
              <li>
                <Link href="/lokalerna" className="text-red-600 hover:text-red-700">
                  Våra lokaler
                </Link>
              </li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-4">Personal & Administration</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Öppettider kontor: Måndag-Fredag 08:00-18:00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8 text-center">
          <p className="text-gray-600">
            &copy; {new Date().getFullYear()} Din Trafikskola Hässleholm. Alla rättigheter förbehållna.
          </p>
        </div>
      </div>
    </footer>
  )
}
