import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type Day = "mo" | "tu" | "we" | "th" | "fr" | "sa" | "su";

export type TimeInterval = {
  start: string; // HH:MM
  end: string;   // HH:MM
};

export type WeeklySchedule = Record<Day, TimeInterval[]>;

export type Exception = {
  date: string; // YYYY-MM-DD (local date in configured timezone)
  appliesTo: "office" | "driving" | "both";
  type: "closed" | "override";
  intervals?: TimeInterval[]; // required if type === "override"
  note?: string;
};

export type OpeningHoursConfig = {
  version: 1;
  timezone: string;
  office: { weekly: WeeklySchedule };
  driving: { weekly: WeeklySchedule };
  exceptions: Exception[];
};

const DAYS: Day[] = ["mo", "tu", "we", "th", "fr", "sa", "su"];

const DEFAULT_OPENING_HOURS: OpeningHoursConfig = {
  version: 1,
  timezone: "Europe/Stockholm",
  office: {
    weekly: {
      mo: [],
      tu: [],
      we: [{ start: "16:00", end: "18:00" }],
      th: [],
      fr: [{ start: "14:00", end: "16:00" }],
      sa: [],
      su: [],
    },
  },
  driving: {
    weekly: {
      mo: [{ start: "08:00", end: "18:00" }],
      tu: [{ start: "08:00", end: "18:00" }],
      we: [{ start: "08:00", end: "18:00" }],
      th: [{ start: "08:00", end: "18:00" }],
      fr: [{ start: "08:00", end: "18:00" }],
      sa: [{ start: "09:00", end: "15:00" }],
      su: [],
    },
  },
  exceptions: [],
};

function isTime(t: any): t is string {
  return typeof t === "string" && /^\d{2}:\d{2}$/.test(t);
}

function isInterval(x: any): x is TimeInterval {
  return x && isTime(x.start) && isTime(x.end) && x.start < x.end;
}

function normalizeWeekly(weekly: any): WeeklySchedule {
  const result: WeeklySchedule = { mo: [], tu: [], we: [], th: [], fr: [], sa: [], su: [] };
  for (const d of DAYS) {
    const list = Array.isArray(weekly?.[d]) ? weekly[d] : [];
    result[d] = list.filter(isInterval).sort((a, b) => (a.start < b.start ? -1 : 1));
    // merge overlaps
    const merged: TimeInterval[] = [];
    for (const cur of result[d]) {
      if (merged.length === 0) { merged.push({ ...cur }); continue; }
      const last = merged[merged.length - 1];
      if (cur.start <= last.end) {
        if (cur.end > last.end) last.end = cur.end;
      } else {
        merged.push({ ...cur });
      }
    }
    result[d] = merged;
  }
  return result;
}

function normalizeExceptions(ex: any): Exception[] {
  if (!Array.isArray(ex)) return [];
  return ex
    .map((e) => {
      const base = {
        date: typeof e?.date === "string" ? e.date : "",
        appliesTo: e?.appliesTo === "office" || e?.appliesTo === "driving" || e?.appliesTo === "both" ? e.appliesTo : "both",
        type: e?.type === "closed" || e?.type === "override" ? e.type : "closed",
        intervals: Array.isArray(e?.intervals) ? e.intervals.filter(isInterval) : undefined,
        note: typeof e?.note === "string" ? e.note : undefined,
      } as Exception;
      if (base.type === "override" && (!base.intervals || base.intervals.length === 0)) {
        // invalid override -> treat as closed
        base.type = "closed";
        delete (base as any).intervals;
      }
      return base;
    })
    .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date));
}

export function withDefaults(config: Partial<OpeningHoursConfig> | null | undefined): OpeningHoursConfig {
  const c = config ?? {};
  return {
    version: 1,
    timezone: typeof (c as any).timezone === "string" && (c as any).timezone ? (c as any).timezone : DEFAULT_OPENING_HOURS.timezone,
    office: { weekly: normalizeWeekly((c as any).office?.weekly) },
    driving: { weekly: normalizeWeekly((c as any).driving?.weekly) },
    exceptions: normalizeExceptions((c as any).exceptions),
  };
}

export async function getOpeningHours(): Promise<OpeningHoursConfig> {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "opening_hours")).limit(1);
    const row = rows[0];
    if (!row || !row.value) {
      return DEFAULT_OPENING_HOURS;
    }
    let parsed: any = null;
    try {
      parsed = JSON.parse(row.value);
    } catch (e) {
      return DEFAULT_OPENING_HOURS;
    }
    return withDefaults(parsed);
  } catch (e) {
    console.error("getOpeningHours error:", e);
    return DEFAULT_OPENING_HOURS;
  }
}

function unionIntervals(a: TimeInterval[], b: TimeInterval[]): TimeInterval[] {
  const all = [...a, ...b].sort((x, y) => (x.start < y.start ? -1 : 1));
  const merged: TimeInterval[] = [];
  for (const cur of all) {
    if (merged.length === 0) { merged.push({ ...cur }); continue; }
    const last = merged[merged.length - 1];
    if (cur.start <= last.end) {
      if (cur.end > last.end) last.end = cur.end;
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

const DAY_NAME: Record<Day, string> = {
  mo: "Monday",
  tu: "Tuesday",
  we: "Wednesday",
  th: "Thursday",
  fr: "Friday",
  sa: "Saturday",
  su: "Sunday",
};

export function toJsonLd(config: OpeningHoursConfig) {
  const openingHoursSpecification: any[] = [];
  const specialOpeningHoursSpecification: any[] = [];

  // Weekly union of office + driving for SEO
  for (const d of DAYS) {
    const union = unionIntervals(config.office.weekly[d], config.driving.weekly[d]);
    for (const iv of union) {
      openingHoursSpecification.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_NAME[d],
        opens: iv.start,
        closes: iv.end,
      });
    }
  }

  // Exceptions
  for (const ex of config.exceptions) {
    if (ex.type === "closed") {
      specialOpeningHoursSpecification.push({
        "@type": "OpeningHoursSpecification",
        opens: "00:00",
        closes: "00:00",
        validFrom: ex.date,
        validThrough: ex.date,
        description: ex.note,
      });
    } else if (ex.type === "override" && ex.intervals && ex.intervals.length > 0) {
      for (const iv of ex.intervals) {
        specialOpeningHoursSpecification.push({
          "@type": "OpeningHoursSpecification",
          opens: iv.start,
          closes: iv.end,
          validFrom: ex.date,
          validThrough: ex.date,
          description: ex.note,
        });
      }
    }
  }

  return { openingHoursSpecification, specialOpeningHoursSpecification };
}
