import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, Clock } from "lucide-react"
import { getOpeningHours } from "@/lib/site-settings/opening-hours"

type Day = "mo" | "tu" | "we" | "th" | "fr" | "sa" | "su"
type TimeInterval = { start: string; end: string }
type WeeklySchedule = Record<Day, TimeInterval[]>

const ORDER: Day[] = ["mo", "tu", "we", "th", "fr", "sa", "su"]
const DAY_SV: Record<Day, string> = {
  mo: "Måndag",
  tu: "Tisdag",
  we: "Onsdag",
  th: "Torsdag",
  fr: "Fredag",
  sa: "Lördag",
  su: "Söndag",
}

function sameIntervals(a: TimeInterval[], b: TimeInterval[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].start !== b[i].start || a[i].end !== b[i].end) return false
  }
  return true
}

function compressWeekly(weekly: WeeklySchedule) {
  const groups: { start: Day; end: Day; intervals: TimeInterval[] }[] = []
  let current: { start: Day; end: Day; intervals: TimeInterval[] } | null = null
  for (const d of ORDER) {
    const intervals = weekly[d]
    if (!current) {
      current = { start: d, end: d, intervals }
      continue
    }
    if (sameIntervals(current.intervals, intervals)) {
      current.end = d
    } else {
      groups.push(current)
      current = { start: d, end: d, intervals }
    }
  }
  if (current) groups.push(current)
  // Filter out groups that represent fully closed days (no intervals)
  return groups.filter((g) => g.intervals.length > 0)
}

function formatGroupLabel(g: { start: Day; end: Day }) {
  return g.start === g.end ? DAY_SV[g.start] : `${DAY_SV[g.start]} - ${DAY_SV[g.end]}`
}

function formatIntervals(list: TimeInterval[]) {
  return list.map((iv) => `${iv.start} - ${iv.end}`).join(", ")
}

export async function Footer() {
  const oh = await getOpeningHours()
  const officeGroups = compressWeekly(oh.office.weekly)
  const drivingGroups = compressWeekly(oh.driving.weekly)

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
              <Image src="/images/din-logo-small.png" alt="Din Trafikskola" width={48} height={48} className="h-12" />
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
            <h4 className="font-medium text-gray-700 mb-2">Kontorstider:</h4>
            <ul className="space-y-2 mb-4">
              {officeGroups.length === 0 ? (
                <li className="flex items-center">
                  <Clock className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-gray-600">Stängt</span>
                </li>
              ) : (
                officeGroups.map((g, idx) => (
                  <li className="flex items-center" key={`office-${idx}`}>
                    <Clock className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-gray-600">{formatGroupLabel(g)}: {formatIntervals(g.intervals)}</span>
                  </li>
                ))
              )}
            </ul>

            <h4 className="font-medium text-gray-700 mb-2">Körlektioner:</h4>
            <ul className="space-y-2">
              {drivingGroups.length === 0 ? (
                <li className="flex items-center">
                  <Clock className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-gray-600">Stängt</span>
                </li>
              ) : (
                drivingGroups.map((g, idx) => (
                  <li className="flex items-center" key={`driving-${idx}`}>
                    <Clock className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-gray-600">{formatGroupLabel(g)}: {formatIntervals(g.intervals)}</span>
                  </li>
                ))
              )}
              <li className="text-sm text-yellow-600 mt-2">* Flexibla tider efter överenskommelse</li>
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
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Din Trafikskola Hässleholm. Alla rättigheter förbehållna.
            </p>
            <div className="flex space-x-6">
              <Link href="/kopvillkor" className="text-red-600 hover:text-red-700 text-sm">
                Köpvillkor
              </Link>
              <Link href="/kopvillkor" className="text-red-600 hover:text-red-700 text-sm">
                Integritetspolicy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
