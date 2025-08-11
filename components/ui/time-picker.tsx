"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Clock, ChevronUp, ChevronDown } from "lucide-react"

type TimePickerPopoverProps = {
  value: string | null
  onChange: (value: string) => void
  label?: string
  className?: string
  intervalMinutes?: number
  start?: string // e.g. "07:00"
  end?: string   // e.g. "20:00"
  size?: 'xs' | 'sm' | 'md'
  density?: 'default' | 'dense'
  mobile?: boolean
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
function fromMinutes(total: number) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`
}

export function TimePickerPopover({ value, onChange, label, className, intervalMinutes = 15, start = '07:00', end = '20:00', size = 'sm', density = 'default', mobile }: TimePickerPopoverProps) {
  const options = useMemo(() => {
    const out: string[] = []
    let t = toMinutes(start)
    const max = toMinutes(end)
    while (t <= max) {
      out.push(fromMinutes(t))
      t += intervalMinutes
    }
    return out
  }, [intervalMinutes, start, end])

  const currentIndex = value ? options.indexOf(value) : -1

  const step = (delta: number) => {
    if (currentIndex < 0) {
      onChange(options[0])
      return
    }
    const next = Math.min(Math.max(0, currentIndex + delta), options.length - 1)
    onChange(options[next])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size={size==='xs'?'sm':size==='sm'?'sm':'default'} variant="outline" className={`w-full justify-start rounded-lg bg-white/10 border-white/20 text-white ${size!=='md'?'text-sm':''} ${className||''}`}>
          <Clock className="w-4 h-4 mr-2" /> {value || label || 'Välj tid'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`${mobile?'w-[min(92vw,280px)]':'w-52'} p-0 overflow-hidden`}>
        <div className="flex items-stretch">
          <div className={`${mobile?'max-h-56':'max-h-48'} flex-1 overflow-auto ${density==='dense'?'p-1':'p-1.5'}`}>
            <div className={`grid grid-cols-1 ${density==='dense'?'gap-0.5':'gap-1'}`}>
              {options.map((opt, idx) => (
                <button
                  key={opt}
                  onClick={()=>onChange(opt)}
                  className={`px-2 ${density==='dense'?'py-1':'py-1.5'} text-left rounded-md border transition-colors ${size!=='md'?'text-sm':''} font-semibold tracking-tight ${
                    opt===value ? 'bg-sky-600 text-white border-sky-500' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className={`${density==='dense'?'w-8':'w-9'} border-l border-white/10 flex flex-col items-center justify-center p-1 gap-1`}>
            <button aria-label="Öka" onClick={()=>step(1)} className="p-1 rounded-md bg-white/10 border border-white/20 hover:bg-white/20"><ChevronUp className={`${density==='dense'?'w-3 h-3':'w-3.5 h-3.5'}`}/></button>
            <button aria-label="Minska" onClick={()=>step(-1)} className="p-1 rounded-md bg-white/10 border border-white/20 hover:bg-white/20"><ChevronDown className={`${density==='dense'?'w-3 h-3':'w-3.5 h-3.5'}`}/></button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}


