"use client"

import { useMemo, useState } from "react"
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth, parseISO } from "date-fns"
import { sv } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

type DatePickerPopoverProps = {
  value: string | null
  onChange: (value: string) => void
  label?: string
  className?: string
  minDate?: string
  maxDate?: string
  size?: 'sm' | 'md'
  density?: 'default' | 'dense'
  mobile?: boolean
}

export function DatePickerPopover({ value, onChange, label, className, minDate, maxDate, size = 'sm', density = 'default', mobile }: DatePickerPopoverProps) {
  const initialDate = value ? parseISO(value) : new Date()
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(initialDate))
  const [open, setOpen] = useState(false)

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
    const chunks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7))
    }
    return chunks
  }, [currentMonth])

  const selectedDate = value ? parseISO(value) : null
  const min = minDate ? parseISO(minDate) : null
  const max = maxDate ? parseISO(maxDate) : null

  const isDisabled = (d: Date) => {
    if (min && d < min) return true
    if (max && d > max) return true
    return false
  }

  const handleSelect = (d: Date) => {
    if (isDisabled(d)) return
    onChange(format(d, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : 'default'}
          className={`w-full justify-start rounded-lg bg-white/10 border-white/20 text-white ${size==='sm'?'text-sm':''} ${className||''}`}
        >
          <Calendar className="w-4 h-4 mr-2" /> {value || label || 'Välj datum'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`sm:w-[320px] w-[min(92vw,320px)] p-3`}>
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" onClick={()=>setCurrentMonth(prev=>subMonths(prev,1))} className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/10">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-semibold text-white">
            {format(currentMonth, 'MMMM yyyy', { locale: sv })}
          </div>
          <Button variant="ghost" size="icon" onClick={()=>setCurrentMonth(prev=>addMonths(prev,1))} className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/10">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] sm:text-xs text-slate-300 mb-1">
          {['M','T','O','T','F','L','S'].map(d=> (<div key={d} className="py-1">{d}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((d, idx) => {
            const isSelected = !!selectedDate && isSameDay(selectedDate, d)
            const outside = !isSameMonth(d, currentMonth)
            const disabled = isDisabled(d)
            return (
              <button
                key={idx}
                disabled={disabled}
                onClick={() => handleSelect(d)}
                className={
                  `${density==='dense'?'py-1.5 text-[13px]':'py-2 text-sm'} ${mobile?'py-2.5':''} rounded-lg border transition-colors ${
                    isSelected ? 'bg-sky-600 text-white border-sky-500' :
                    outside ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-white/10 text-white border-white/20'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/20'}`
                }
              >
                {format(d, 'd')}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}


