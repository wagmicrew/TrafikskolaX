"use client";

import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, Clock, MapPin } from "lucide-react"
import { useOpeningHours } from "@/hooks/useOpeningHours"
import { useSiteSettings } from "@/hooks/useSiteSettings"
import type { OpeningHoursConfig } from "@/lib/site-settings/opening-hours"
import {
  Footer,
  FooterBrand,
  FooterCopyright,
  FooterDivider,
  FooterIcon,
  FooterLink,
  FooterLinkGroup,
  FooterTitle,
} from "flowbite-react"
import { BsFacebook, BsInstagram, BsTiktok } from "react-icons/bs"

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

export function FooterComponent({ opening }: { opening?: OpeningHoursConfig }) {
  const { data: openingData, loading: openingLoading, error: openingError } = useOpeningHours()
  const { settings, loading: settingsLoading } = useSiteSettings()

  // Guard against undefined shape
  const source = opening || openingData || null
  const officeWeekly = source?.office?.weekly as any
  const drivingWeekly = source?.driving?.weekly as any

  const officeGroups = officeWeekly ? compressWeekly(officeWeekly) : []
  const drivingGroups = drivingWeekly ? compressWeekly(drivingWeekly) : []

  return (
    <Footer container>
      <div className="w-full">
        <div className="grid w-full justify-between sm:flex sm:justify-between md:flex md:grid-cols-1">
          <div>
            <FooterBrand
              href="/"
              src="/images/din-logo-small.png"
              alt="Din Trafikskola Hässleholm"
              name="Din Trafikskola Hässleholm"
            />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs">
              Hässleholms nyaste trafikskola med fokus på kvalitet och personlig service. Vi erbjuder utbildning för
              B-körkort i en trygg och modern miljö.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:mt-4 sm:grid-cols-3 sm:gap-6">
            {/* Contact Information */}
            <div>
              <FooterTitle title="Kontakta oss" />
              <FooterLinkGroup col>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <FooterLink href="tel:0760389192">0760-389192</FooterLink>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <FooterLink href="mailto:info@dintrafikskolahlm.se">
                    info@dintrafikskolahlm.se
                  </FooterLink>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Östergatan 3a<br />
                    281 30 Hässleholm
                  </div>
                </div>
              </FooterLinkGroup>
            </div>

            {/* Quick Links */}
            <div>
              <FooterTitle title="Snabblänkar" />
              <FooterLinkGroup col>
                <FooterLink href="/om-oss">Om oss</FooterLink>
                <FooterLink href="/vara-tjanster">Våra tjänster</FooterLink>
                <FooterLink href="/boka-korning">Boka körlektion</FooterLink>
                <FooterLink href="/lokalerna">Våra lokaler</FooterLink>
              </FooterLinkGroup>
            </div>

            {/* Opening Hours */}
            <div>
              <FooterTitle title="Öppettider" />
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-gray-400">Kontorstider:</p>
                  {officeGroups.length === 0 ? (
                    <p className="text-sm text-gray-500">Stängt</p>
                  ) : (
                    officeGroups.map((g, idx) => (
                      <p key={`office-${idx}`} className="text-sm text-gray-500">
                        {formatGroupLabel(g)}: {formatIntervals(g.intervals)}
                      </p>
                    ))
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-gray-400">Körlektioner:</p>
                  {drivingGroups.length === 0 ? (
                    <p className="text-sm text-gray-500">Stängt</p>
                  ) : (
                    drivingGroups.map((g, idx) => (
                      <p key={`driving-${idx}`} className="text-sm text-gray-500">
                        {formatGroupLabel(g)}: {formatIntervals(g.intervals)}
                      </p>
                    ))
                  )}
                  <p className="text-xs text-yellow-600 mt-1">
                    * Flexibla tider efter överenskommelse
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <FooterDivider />

        <div className="w-full sm:flex sm:items-center sm:justify-between">
          <FooterCopyright href="/" by="Din Trafikskola Hässleholm" year={new Date().getFullYear()} />
          <div className="mt-4 flex space-x-6 sm:mt-0 sm:justify-center">
            {/* Social Media Links */}
            {settings?.social_facebook && (
              <FooterIcon href={settings.social_facebook} icon={BsFacebook} />
            )}
            {settings?.social_instagram && (
              <FooterIcon href={settings.social_instagram} icon={BsInstagram} />
            )}
            {settings?.social_tiktok && (
              <FooterIcon href={settings.social_tiktok} icon={BsTiktok} />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Org.nr: 559123-4567 | F-skattsedel: Ja
          </p>
          <div className="flex gap-4">
            <FooterLink href="/villkor" className="text-sm">
              Allmänna villkor
            </FooterLink>
            <FooterLink href="/integritetspolicy" className="text-sm">
              Integritetspolicy
            </FooterLink>
          </div>
        </div>
      </div>
    </Footer>
  )
}
