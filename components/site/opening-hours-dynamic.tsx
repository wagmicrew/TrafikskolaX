"use client"

import { useEffect, useState, useMemo } from 'react'
import { Clock } from 'lucide-react'

// Local types matching the API response
export type Day = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'
export type TimeInterval = { start: string; end: string }
export type WeeklySchedule = Record<Day, TimeInterval[]>
export type OpeningHoursConfig = {
  version: number
  timezone: string
  office: { weekly: WeeklySchedule }
  driving: { weekly: WeeklySchedule }
  exceptions: Array<{
    date: string
    appliesTo: 'office' | 'driving' | 'both'
    type: 'closed' | 'override'
    intervals?: TimeInterval[]
    note?: string
  }>
}

type Props = {
  scope?: 'office' | 'driving' | 'both'
  className?: string
  showSectionTitles?: boolean
  emptyLabel?: string
}

const ORDER: Day[] = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']
const DAY_SV: Record<Day, string> = {
  mo: 'Måndag',
  tu: 'Tisdag',
  we: 'Onsdag',
  th: 'Torsdag',
  fr: 'Fredag',
  sa: 'Lördag',
  su: 'Söndag',
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
  return groups.filter((g) => g.intervals.length > 0)
}

function formatGroupLabel(g: { start: Day; end: Day }) {
  return g.start === g.end ? DAY_SV[g.start] : `${DAY_SV[g.start]} - ${DAY_SV[g.end]}`
}

function formatIntervals(list: TimeInterval[]) {
  return list.map((iv) => `${iv.start} - ${iv.end}`).join(', ')
}

export default function OpeningHoursDynamic({
  scope = 'both',
  className,
  showSectionTitles = true,
  emptyLabel = 'Stängt',
}: Props) {
  const [data, setData] = useState<OpeningHoursConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/opening-hours', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load opening hours')
        const json = await res.json()
        if (mounted) setData(json.opening_hours as OpeningHoursConfig)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Fel vid hämtning av öppettider')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const officeGroups = useMemo(() => (data ? compressWeekly(data.office.weekly) : []), [data])
  const drivingGroups = useMemo(() => (data ? compressWeekly(data.driving.weekly) : []), [data])

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center text-gray-600 text-sm">
          <Clock className="w-4 h-4 mr-2 animate-pulse" />
          Hämtar öppettider...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <div className="text-sm text-red-600">Kunde inte ladda öppettider just nu.</div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className={className}>
      {(scope === 'office' || scope === 'both') && (
        <div className="mb-4">
          {showSectionTitles && (
            <h3 className="font-semibold text-gray-800 mb-2">Kontorstider:</h3>
          )}
          <ul className="space-y-2">
            {officeGroups.length === 0 ? (
              <li className="flex items-center">
                <Clock className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-gray-700">{emptyLabel}</span>
              </li>
            ) : (
              officeGroups.map((g, idx) => (
                <li key={`office-${idx}`} className="flex items-center">
                  <Clock className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-gray-700">{formatGroupLabel(g)}: {formatIntervals(g.intervals)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {(scope === 'driving' || scope === 'both') && (
        <div>
          {showSectionTitles && (
            <h3 className="font-semibold text-gray-800 mb-2">Körlektioner:</h3>
          )}
          <ul className="space-y-2">
            {drivingGroups.length === 0 ? (
              <li className="flex items-center">
                <Clock className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-gray-700">{emptyLabel}</span>
              </li>
            ) : (
              drivingGroups.map((g, idx) => (
                <li key={`driving-${idx}`} className="flex items-center">
                  <Clock className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-gray-700">{formatGroupLabel(g)}: {formatIntervals(g.intervals)}</span>
                </li>
              ))
            )}
            <li className="text-sm text-yellow-600 mt-2">* Flexibla tider efter överenskommelse</li>
          </ul>
        </div>
      )}
    </div>
  )
}
