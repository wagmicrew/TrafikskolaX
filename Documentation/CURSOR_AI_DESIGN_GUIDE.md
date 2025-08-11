### Cursor AI Design Guide

This guide explains how to implement the Admin dashboard design language used in `dashboard/admin` pages: glassmorphism cards, crisp typography, and consistent UX with our shared UI primitives.

#### Design Principles
- High contrast headings: bold, clear, legible over translucent/dark backgrounds.
- Glassmorphism surfaces: translucent backgrounds, backdrop blur, soft borders.
- Neumorphic hints: soft, layered shadows; subtle depth, not heavy embossing.
- Consistent primitives: use components from `components/ui` (Button, Input, Card, Select, Switch, Textarea, Dialog, etc.).
- Motion: light transitions on hover/focus; avoid excessive animations.

#### Core Container
- Admin pages are wrapped by `app/dashboard/admin/layout.tsx` using a dark gradient background and a glass nav.
- Put page content inside cards that follow the glassmorphism recipe:

```
<Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl">
  <CardHeader>
    <CardTitle className="text-white font-extrabold drop-shadow">Section Title</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
 </Card>
```

Key classes:
- `bg-white/10` for translucent surface
- `backdrop-blur-md` for blur
- `border border-white/20` for subtle outline
- `text-white` for legibility
- `shadow-2xl` to elevate key surfaces
- `rounded-2xl` for pill-like geometry

#### Typography
- Section titles: `text-white font-extrabold drop-shadow` to ensure readability.
- Body and labels: `text-slate-200`/`text-white` on dark backgrounds; switch to `text-slate-800`/`text-black` on light sections.
- Use consistent sizes: titles 2xl, section headers lg-xl, body sm-base.

#### Controls
- Inputs/Textareas: use UI primitives with translucent styling:
```
<Input className="bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
<Textarea className="bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
```

- Selects: use `Select`, not native `<select>`:
```
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
    <SelectValue placeholder="Välj" />
  </SelectTrigger>
  <SelectContent className="bg-slate-900/90 text-white border-white/10">
    <SelectItem value="a">A</SelectItem>
  </SelectContent>
</Select>
```

- Switches: use `Switch` for toggles on dark surfaces.

- Buttons: prefer bold accent colors for primary actions; outline for secondary on glass:
```
<Button className="bg-sky-600 hover:bg-sky-500">Primär</Button>
<Button variant="outline" className="bg-white/5 hover:bg-white/10 border-white/20 text-white">Sekundär</Button>
```

#### Panels and Metrics
- Use small glass chips for stats: `px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20`.
- For nested content inside cards, add a softer inner panel: `bg-white/5 border border-white/10 rounded-xl p-4`.

#### Dialogs/Popovers
- Use `components/ui/dialog` and render content with glass styles:
```
<DialogContent className="w-full max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none">
  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6">...</div>
</DialogContent>
```

#### Accessibility & Readability
- Ensure contrast: titles are pure white on dark glass, or `text-black` on light panels.
- Maintain focus rings (UI primitives keep focus-visible).
- Avoid long blocks of centered text; left-align for readability.

#### Reuse Checklist
1) Wrap content in a glass `Card`.
2) Use bold, high-contrast `CardTitle`.
3) Use `components/ui` primitives for inputs/selects/buttons.
4) Use `bg-white/10` + `backdrop-blur-md` + `border-white/20` for primary surfaces.
5) Keep spacing generous: `p-6`, `gap-3/4`, `rounded-2xl`.
6) Prefer `toast` over `alert` for feedback.

#### Example Section Skeleton
```
<Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl">
  <CardHeader className="flex items-center justify-between">
    <CardTitle className="text-white font-extrabold drop-shadow">Titel</CardTitle>
    <Button className="bg-emerald-600 hover:bg-emerald-500">Action</Button>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Input className="bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
      <Select>
        <SelectTrigger className="bg-white/10 border-white/20 text-white">
          <SelectValue placeholder="Välj" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900/90 text-white border-white/10">
          <SelectItem value="x">X</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <Textarea className="bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
  </CardContent>
</Card>
```

Adopt this guide for all new admin pages to ensure a cohesive, sleek UI.


