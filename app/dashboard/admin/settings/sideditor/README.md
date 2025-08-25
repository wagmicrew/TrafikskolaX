# Sideditor - WYSIWYG Sidredigerare

Sideditor är ett kraftfullt WYSIWYG-redigeringsverktyg för att redigera innehåll på de publika sidorna i Din Trafikskola Hässleholm.

## Funktioner

### 🎯 Huvudfunktioner
- **WYSIWYG Editor**: Puck-baserad editor med visuell blockredigering
- **Sidor som stöds**:
  - **Om oss** (`app/om-oss/page.tsx`) - Presentation av trafikskolan
  - **Våra Tjänster** (`app/vara-tjanster/page.tsx`) - Tjänster och priser
  - **Våra Lokaler** (`app/lokalerna/page.tsx`) - Lokalbeskrivning
- **Direkt filredigering**: Redigerar filer direkt i filsystemet
- **Backup-system**: Automatisk backup skapas vid varje sparning
- **Förhandsgranskning**: Se hur sidan kommer att se ut innan sparning
- **Bilduppladdning**: Ladda upp bilder direkt från editorn till `/public/images/`

### 🖋️ Editorfunktioner
- **Blockbaserad redigering**: Visuell blockredigering med drag-and-drop
- **Komponenter**: Rubriker, paragrafer, text, listor, länkar, bilder
- **Formatering**: Fetstil, kursiv, listor och andra textformateringar
- **Bildhantering**: Infoga och hantera bilder
- **Länkar**: Skapa och redigera hyperlänkar
- **Responsiv design**: Automatisk responsivitet för alla komponenter
- **Live preview**: Se ändringar i realtid

### 🛡️ Säkerhet
- **Admin-autentisering**: Kräver admin-behörighet
- **Backup**: Automatisk backup av originalfiler
- **Validering**: Innehållsvalidering innan sparning
- **Felhantering**: Omfattande felhantering med toast-meddelanden

## Användning

### 📍 Tillgång
1. Logga in som admin
2. Gå till **Admin** → **Inställningar**
3. Klicka på **📝 Sideditor** knappen

### 🔧 Redigera en sida
1. **Välj sida**: Klicka på kortet för sidan du vill redigera
2. **Redigera innehåll**: Använd WYSIWYG-editorn för att redigera text och innehåll
3. **Ladda upp bilder**: Använd bildknappen i editorn för att ladda upp nya bilder
4. **Förhandsgranska**: Klicka på "Förhandsgranska" för att se hur sidan kommer att se ut
5. **Spara**: Klicka på "Spara" för att spara ändringarna

### 📸 Bildhantering
- **Uppladdning**: Bilder laddas upp till `/public/images/`
- **Automatisk namngivning**: Bilder får unika namn för att undvika konflikter
- **Formatstöd**: JPEG, PNG, GIF, WebP
- **Storleksgräns**: 5MB per bild
- **URL-generering**: Automatisk generering av publika URL:er

## Teknisk Implementation

### 🏗️ Arkitektur
```
app/dashboard/admin/settings/sideditor/
├── page.tsx                    # Huvudsidan
├── sideditor-client.tsx        # Huvudkomponent
├── README.md                   # Denna dokumentation
└── API endpoints:
    ├── load-page/route.ts      # Ladda sidinnehåll
    ├── save-page/route.ts      # Spara sidinnehåll
    └── upload-image/route.ts   # Bilduppladdning
```

### 📊 API Endpoints

#### GET `/api/admin/sideditor/load-page?page={pageId}`
Laddar innehåll för en specifik sida.

**Parametrar:**
- `page`: En av `om-oss`, `vara-tjanster`, `lokalerna`

**Svar:**
```json
{
  "title": "Om oss",
  "content": "Filinnehåll...",
  "lastModified": "2024-01-01T12:00:00.000Z",
  "path": "app/om-oss/page.tsx"
}
```

#### POST `/api/admin/sideditor/save-page`
Sparar innehåll för en sida.

**Body:**
```json
{
  "page": "om-oss",
  "content": "Nytt innehåll...",
  "title": "Om oss"
}
```

#### POST `/api/admin/sideditor/upload-image`
Laddar upp en bild.

**FormData:**
- `file`: Bildfilen

### 🎨 UI/UX Funktioner

#### Toast-meddelanden
- **Framgång**: Grön toast för lyckade operationer
- **Varning**: Gul toast för varningar
- **Fel**: Röd toast för fel

#### Popups och Dialoger
- **Förhandsgranskning**: Modal för att förhandsgranska ändringar
- **Bilduppladdning**: Dialog för bildhantering
- **Bekräftelse**: Dialoger för kritiska operationer

#### Responsiv Design
- **Mobile-first**: Optimerad för alla enheter
- **Dark mode**: Mörkt tema för bättre läsbarhet
- **Accessible**: WCAG-kompatibel

## Installation och Konfiguration

### 📦 Beroenden
```bash
npm install @tinymce/tinymce-react tinymce
```

### ⚙️ Konfiguration
Ingen särskild konfiguration behövs. Verktyget använder:
- TinyMCE Community Edition (gratis)
- Next.js API routes
- Node.js filsystem API

## Felsökning

### Vanliga Problem

#### Editorn laddar inte
**Lösning**: Kontrollera att TinyMCE-paketen är korrekt installerade
```bash
npm list @tinymce/tinymce-react tinymce
```

#### Bilder laddas inte upp
**Lösning**: Kontrollera att `/public/images/` mappen finns och är skrivbar
```bash
ls -la public/images/
```

#### Sidor kan inte sparas
**Lösning**: Kontrollera filbehörigheter och att användaren har admin-rättigheter
```bash
ls -la app/om-oss/page.tsx
```

### Loggfiler
Fel loggas till serverkonsolen med prefixet `[Sideditor]`.

### Backup-filer
Backup-filer skapas automatiskt med formatet:
`filnamn.backup.{timestamp}`

## Säkerhet

### 🔐 Behörigheter
- Endast admin-användare kan komma åt Sideditor
- Alla API-anrop verifieras med `requireAuth('admin')`

### 🛡️ Dataintegritet
- Automatisk backup innan ändringar
- Validering av innehåll innan sparning
- Felhantering för alla operationer

## Framtida Förbättringar

### 🚀 Planerade Funktioner
- **Versionshantering**: Spåra ändringar över tid
- **Sammarbete**: Flera användare kan redigera samtidigt
- **SEO-verktyg**: Inbyggda SEO-rekommendationer
- **Mall-system**: Återanvändbara innehållsmallar
- **Förhandsvisning**: Live preview utan att spara

### 🔧 Tekniska Förbättringar
- **Prestanda**: Lazy loading av stora sidor
- **Cache**: Cache för ofta använda sidor
- **Diff**: Visa skillnader mellan versioner
- **Export**: Exportera innehåll till olika format
