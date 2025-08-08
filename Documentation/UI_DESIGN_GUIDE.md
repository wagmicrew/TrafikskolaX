# UI Design Guide (Din Trafikskola)

This document defines our design setup, recent UI changes, and rules to keep a consistent look-and-feel across the app. It includes concise instructions for human developers and AI agents.

## Design Foundations

- **Visual style**: Dark theme with glassmorphism surfaces and subtle neumorphism accents.
- **Palette** (Tailwind):
  - Background gradient: `from-slate-900 via-slate-800 to-slate-900`
  - Text base: `text-slate-100` (on dark), `text-white` for headings
  - Accents: `text-sky-300`, `text-rose-400/600` (critical/CTA)
  - Glass surface: `bg-white/10` with `backdrop-blur-md` and `border border-white/20`
  - Soft overlays: `bg-white/5` and `border-white/10` for secondary containers
- **Shape**: Rounded corners by default (`rounded-xl`), large feature surfaces (`rounded-2xl`).
- **Spacing**: Use Tailwind spacing scale; typical blocks `p-4/6`, page gutters `px-4 md:px-6 lg:px-8`.
- **Typography**: Headings `text-2xl/3xl/4xl font-bold`; body `text-sm/base` with high contrast. Prefer sentence case Swedish.
- **Icons**: Lucide icons. Accent icons with `text-sky-300` or contextual colors.
- **Interactions**:
  - Hover: elevate via `hover:bg-white/20` on glass, or stronger brand color for CTAs
  - Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`
  - Focus: ensure visible rings on inputs `focus:ring-2 focus:ring-sky-500`

## Core Glass Surface Patterns

- **Panel (default)**
  - Container: `rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white`
  - Use for cards, lists, filters, and detail panes

- **Header bar**
  - Container: `backdrop-blur-md bg-white/10 border-b border-white/10`
  - Title: `text-white drop-shadow-sm`

- **Chips/Stats**
  - Container: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3`
  - Number: `text-sky-300`

- **Secondary controls**
  - Buttons: `bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl`
  - Destructive: `bg-rose-600/80 hover:bg-rose-600 text-white`

## Component Usage

- Prefer existing components in `components/ui` (Button, Input, Card, Dialog, Tabs, etc.).
- Layer Tailwind classes on these primitives to achieve glass look; do not fork component logic.
- Inputs on dark backgrounds: `bg-white/10 border border-white/20 text-white placeholder:text-white/60` with `focus:ring-2 focus:ring-sky-500`.

## Layout & Responsiveness

- Containers: center with `container mx-auto` and use responsive padding.
- Grids: prefer `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` patterns.
- Calendars/lists: degrade gracefully to 1–2 columns on mobile.

## Copy & Language (Swedish)

- Use clear Swedish labels: e.g., “Dagens lektioner”, “Bokningar”, “Spara ändringar”.
- Sentence case; avoid ALL CAPS. Keep button text short.

## Recent Design Changes (reference)

- Booking flow
  - Header copy refined on `app/boka-korning/page.tsx`
  - Stepper clarity and accessibility updated in `components/booking/booking-steps.tsx`
  - Lesson selection loading/price formatting in `components/booking/lesson-selection.tsx`
  - Week calendar responsive grid in `components/booking/week-calendar.tsx`
  - Confirmation CTA styled to brand red in `components/booking/booking-confirmation.tsx`
- Teacher dashboard
  - Full glass redesign in `app/dashboard/teacher/teacher-dashboard-client.tsx`
- Admin dashboard
  - Layout and overview: `app/dashboard/admin/layout.tsx`, `app/dashboard/admin/page.tsx`
  - Bookings: `app/dashboard/admin/bookings/bookings-client.tsx`
  - Users: `app/dashboard/admin/users/users-client.tsx`
  - Lessons/Packages: `app/dashboard/admin/lessons/lessons-client.tsx`
  - Slots: `app/dashboard/admin/slots/slots-client.tsx`

## Do / Don’t (Consistency Rules)

- Do use dark gradient page backgrounds and glass panels for content.
- Do use `rounded-xl`+ and subtle borders (`border-white/20`).
- Do use `text-white`/`text-slate-100` on dark surfaces; ensure contrast.
- Do keep CTAs consistent: primary (glass), destructive (rose), accent (sky).
- Do make mobile-first grids and ensure inputs/controls are tappable.
- Don’t mix opaque white boxes on dark pages; use glass panels instead.
- Don’t introduce new color tokens without mapping to Tailwind classes above.
- Don’t bypass existing `components/ui` primitives.

## Quick Recipes

- Feature card
```
<div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white">
  <h3 className="text-xl font-bold">Titel</h3>
  <p className="text-slate-300">Beskrivning</p>
  <button className="mt-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2">Åtgärd</button>
</div>
```

- Filter row
```
<div className="flex gap-2 items-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-3">
  <input className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500" />
  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl">Sök</button>
</div>
```

## For AI Agents (must-follow rules)

- Always default to dark gradient pages with glass panels for new screens.
- Wrap content in `bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl` unless explicitly a full-bleed section.
- Use existing `components/ui` primitives. Do not create ad-hoc buttons/inputs; style primitives with Tailwind utilities.
- Pick accents from: sky (informational), rose (destructive/critical), green (success), never random hex colors.
- Inputs on dark: `bg-white/10 border-white/20 text-white` + `focus:ring-2 focus:ring-sky-500`.
- Spacing: prefer `p-4/6` and `gap-2/3/4`. Avoid tight layouts.
- Responsive grids: start at 1 col, step up at `sm`, `md`, `lg`.
- Accessibility: ensure text contrast; keep visible focus outlines on all interactive elements.
- Swedish copy: concise, sentence case. Keep button labels short (1–3 words).

## Review Checklist (before merging)

- Surface uses glass pattern (bg/blur/border/radius) and appropriate text colors
- Buttons use standard variants (glass/rose/green) with clear hover/disabled states
- Inputs have correct background/border/placeholder and focus ring
- Mobile layout tested; grid collapses to 1–2 cols
- Icons and headings use accent colors consistently
- Swedish labels are clear and consistent


