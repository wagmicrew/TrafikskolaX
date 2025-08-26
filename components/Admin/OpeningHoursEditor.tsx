"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OpeningHoursConfig, Day, TimeInterval, Exception } from "@/lib/site-settings/opening-hours";

const DAYS: Day[] = ["mo", "tu", "we", "th", "fr", "sa", "su"];
const DAY_LABELS: Record<Day, string> = {
  mo: "Mån",
  tu: "Tis",
  we: "Ons",
  th: "Tor",
  fr: "Fre",
  sa: "Lör",
  su: "Sön",
};

type Props = {
  value: OpeningHoursConfig;
  onChange: (next: OpeningHoursConfig) => void;
};

export default function OpeningHoursEditor({ value, onChange }: Props) {
  const updateTimezone = (tz: string) => {
    onChange({ ...value, timezone: tz });
  };

  const updateWeekly = (
    section: "office" | "driving",
    day: Day,
    idx: number,
    field: keyof TimeInterval,
    newVal: string
  ) => {
    const next = { ...value } as OpeningHoursConfig;
    const arr = [...next[section].weekly[day]];
    const item = { ...arr[idx], [field]: newVal } as TimeInterval;
    arr[idx] = item;
    next[section] = { weekly: { ...next[section].weekly, [day]: arr } } as any;
    onChange(next);
  };

  const addInterval = (section: "office" | "driving", day: Day) => {
    const next = { ...value } as OpeningHoursConfig;
    const arr = [...(next[section].weekly[day] || [])];
    arr.push({ start: "09:00", end: "17:00" });
    next[section] = { weekly: { ...next[section].weekly, [day]: arr } } as any;
    onChange(next);
  };

  const removeInterval = (section: "office" | "driving", day: Day, idx: number) => {
    const next = { ...value } as OpeningHoursConfig;
    const arr = [...(next[section].weekly[day] || [])];
    arr.splice(idx, 1);
    next[section] = { weekly: { ...next[section].weekly, [day]: arr } } as any;
    onChange(next);
  };

  const addException = () => {
    const next = { ...value } as OpeningHoursConfig;
    const ex = [...(next.exceptions || [])];
    ex.push({ date: "", appliesTo: "both", type: "closed", note: "" });
    next.exceptions = ex as Exception[];
    onChange(next);
  };

  const updateException = <K extends keyof Exception>(i: number, key: K, val: Exception[K]) => {
    const next = { ...value } as OpeningHoursConfig;
    const ex = [...(next.exceptions || [])];
    const item = { ...(ex[i] || { date: "", appliesTo: "both", type: "closed" }) } as Exception;
    (item as any)[key] = val;
    // Ensure intervals exists when switching to override
    if (key === "type" && val === "override" && !item.intervals) {
      item.intervals = [{ start: "09:00", end: "17:00" }];
    }
    if (key === "type" && val === "closed") {
      delete (item as any).intervals;
    }
    ex[i] = item;
    next.exceptions = ex as Exception[];
    onChange(next);
  };

  const addExceptionInterval = (i: number) => {
    const next = { ...value } as OpeningHoursConfig;
    const ex = [...(next.exceptions || [])];
    const item = { ...(ex[i] || { date: "", appliesTo: "both", type: "override", intervals: [] }) } as Exception;
    const ints = [...(item.intervals || [])];
    ints.push({ start: "09:00", end: "17:00" });
    item.intervals = ints;
    ex[i] = item;
    next.exceptions = ex as Exception[];
    onChange(next);
  };

  const updateExceptionInterval = (i: number, idx: number, field: keyof TimeInterval, val: string) => {
    const next = { ...value } as OpeningHoursConfig;
    const ex = [...(next.exceptions || [])];
    const item = { ...(ex[i] as Exception) } as Exception;
    const ints = [...(item.intervals || [])];
    const updated = { ...(ints[idx] || { start: "", end: "" }), [field]: val } as TimeInterval;
    ints[idx] = updated;
    item.intervals = ints;
    ex[i] = item;
    next.exceptions = ex as Exception[];
    onChange(next);
  };

  const removeExceptionInterval = (i: number, idx: number) => {
    const next = { ...value } as OpeningHoursConfig;
    const ex = [...(next.exceptions || [])];
    const item = { ...(ex[i] as Exception) } as Exception;
    const ints = [...(item.intervals || [])];
    ints.splice(idx, 1);
    item.intervals = ints;
    ex[i] = item;
    next.exceptions = ex as Exception[];
    onChange(next);
  };

  const removeException = (i: number) => {
    const next = { ...value } as OpeningHoursConfig;
    const ex = [...(next.exceptions || [])];
    ex.splice(i, 1);
    next.exceptions = ex as Exception[];
    onChange(next);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="timezone" className="text-black font-medium">Tidszon</Label>
        <Input
          id="timezone"
          placeholder="Europe/Stockholm"
          value={value.timezone || ""}
          onChange={(e) => updateTimezone(e.target.value)}
          className="border-gray-300 text-black focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionWeekly
          title="Kontor (öppettider)"
          weekly={value.office.weekly}
          onAdd={(day) => addInterval("office", day)}
          onChange={(day, i, field, v) => updateWeekly("office", day, i, field, v)}
          onRemove={(day, i) => removeInterval("office", day, i)}
        />
        <SectionWeekly
          title="Körlektioner"
          weekly={value.driving.weekly}
          onAdd={(day) => addInterval("driving", day)}
          onChange={(day, i, field, v) => updateWeekly("driving", day, i, field, v)}
          onRemove={(day, i) => removeInterval("driving", day, i)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-black font-bold text-lg">Undantag</h3>
          <Button type="button" variant="outline" onClick={addException} className="border-gray-300 text-gray-700 hover:bg-gray-50">Lägg till undantag</Button>
        </div>
        <div className="space-y-4">
          {(value.exceptions || []).length === 0 && (
            <p className="text-sm text-gray-600">Inga undantag definierade.</p>
          )}
          {(value.exceptions || []).map((ex, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-black font-medium">Datum (YYYY-MM-DD)</Label>
                  <Input
                    placeholder="2025-12-24"
                    value={ex.date || ""}
                    onChange={(e) => updateException(i, "date", e.target.value)}
                    className="border-gray-300 text-black focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-black font-medium">Gäller</Label>
                  <Select value={ex.appliesTo} onValueChange={(v) => updateException(i, "appliesTo", v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Kontor</SelectItem>
                      <SelectItem value="driving">Körning</SelectItem>
                      <SelectItem value="both">Båda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-black font-medium">Typ</Label>
                  <Select value={ex.type} onValueChange={(v) => updateException(i, "type", v as any)}>
                    <SelectTrigger className="border-gray-300 text-black focus:border-blue-500">
                      <SelectValue placeholder="Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="closed">Stängt</SelectItem>
                      <SelectItem value="override">Ersätt tider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-black font-medium">Notis</Label>
                  <Input
                    placeholder="Julafton"
                    value={ex.note || ""}
                    onChange={(e) => updateException(i, "note", e.target.value)}
                    className="border-gray-300 text-black focus:border-blue-500"
                  />
                </div>
              </div>

              {ex.type === "override" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm text-black font-medium">Tidsintervall</h4>
                    <Button type="button" size="sm" variant="outline" onClick={() => addExceptionInterval(i)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                      Lägg till intervall
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(ex.intervals || []).map((iv, idx) => (
                      <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        <div>
                          <Label className="text-black font-medium">Start</Label>
                          <Input value={iv.start} onChange={(e) => updateExceptionInterval(i, idx, "start", e.target.value)} className="border-gray-300 text-black focus:border-blue-500" />
                        </div>
                        <div>
                          <Label className="text-black font-medium">Slut</Label>
                          <Input value={iv.end} onChange={(e) => updateExceptionInterval(i, idx, "end", e.target.value)} className="border-gray-300 text-black focus:border-blue-500" />
                        </div>
                        <div className="md:col-span-1">
                          <Button type="button" variant="destructive" onClick={() => removeExceptionInterval(i, idx)}>
                            Ta bort
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="button" variant="destructive" onClick={() => removeException(i)} className="bg-red-600 hover:bg-red-700">
                  Ta bort undantag
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionWeekly({
  title,
  weekly,
  onAdd,
  onChange,
  onRemove,
}: {
  title: string;
  weekly: Record<Day, TimeInterval[]>;
  onAdd: (day: Day) => void;
  onChange: (day: Day, idx: number, field: keyof TimeInterval, v: string) => void;
  onRemove: (day: Day, idx: number) => void;
}) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-4 space-y-3 shadow-sm">
      <h3 className="text-black font-bold text-lg">{title}</h3>
      <div className="space-y-4">
        {DAYS.map((d) => (
          <div key={d} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-black font-medium">{DAY_LABELS[d]}</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => onAdd(d)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Lägg till intervall
              </Button>
            </div>
            {(weekly[d] || []).length === 0 ? (
              <p className="text-xs text-red-600 font-semibold">Inga tider</p>
            ) : (
              <div className="space-y-2">
                {(weekly[d] || []).map((iv, idx) => (
                  <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div>
                      <Label className="text-black font-medium">Start</Label>
                      <Input value={iv.start} onChange={(e) => onChange(d, idx, "start", e.target.value)} className="border-gray-300 text-black focus:border-blue-500" />
                    </div>
                    <div>
                      <Label className="text-black font-medium">Slut</Label>
                      <Input value={iv.end} onChange={(e) => onChange(d, idx, "end", e.target.value)} className="border-gray-300 text-black focus:border-blue-500" />
                    </div>
                    <div className="md:col-span-1">
                      <Button type="button" variant="destructive" onClick={() => onRemove(d, idx)} className="bg-red-600 hover:bg-red-700">
                        Ta bort
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
