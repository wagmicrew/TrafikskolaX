# E-postmallredigerare med TinyMCE

## 📧 Översikt

Denna dokumentation beskriver den ombyggda e-postmallredigeraren som använder **TinyMCE** som WYSIWYG-editor. Systemet är designat för att ge administratörer ett professionellt verktyg för att skapa och redigera e-postmallar med avancerade redigeringsfunktioner.

## 🎯 Syfte

Att ersätta den tidigare enkla textarea-baserade editorn med en professionell WYSIWYG-editor som ger:
- Visuell redigering av e-postinnehåll
- Avancerade formateringsalternativ
- Bilduppladdning och hantering
- Variabelsystem för dynamiskt innehåll
- Förhandsgranskningsfunktioner
- Svenskt användargränssnitt

## 🏗️ Teknisk Arkitektur

### Komponentstruktur

```
app/dashboard/admin/email-templates/
├── page.tsx                          # Huvudsida för e-postmallar
├── EmailTemplateBuilder.tsx          # Huvudkomponent med TinyMCE
├── API endpoints:
│   ├── load-page/route.ts            # Ladda mallinnehåll
│   ├── save-page/route.ts            # Spara mallinnehåll
│   └── upload-image/route.ts         # Bilduppladdning
└── README.md                         # Implementationsdokumentation
```

### Beroenden

```json
{
  "@tinymce/tinymce-react": "^5.x.x",
  "tinymce": "^6.x.x",
  "react": "^18.x.x",
  "react-hook-form": "^7.x.x",
  "zod": "^3.x.x",
  "sonner": "^1.x.x"
}
```

## 🎨 Implementerade Funktioner

### TinyMCE Integration

#### Grundkonfiguration

```typescript
const TINYMCE_CONFIG = {
  height: 500,
  menubar: true,
  language: 'sv_SE',
  skin: 'oxide-dark',
  branding: false,
  promotion: false,
  // ... ytterligare konfiguration
}
```

#### Verktygsfält

```javascript
toolbar: 'undo redo | blocks | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help | image media link | code | preview | fullscreen | table | emoticons | codesample | template | pagebreak | insertdatetime | searchreplace | visualblocks | variables'
```

### Redigeringsfunktioner

#### Textformatering
- **Fetstil, kursiv, understrykning**
- **Genomstrykning**
- **Textfärger (förgrund och bakgrund)**
- **Teckensnittsstorlekar**

#### Layout och Struktur
- **Rubriknivåer (H1-H6)**
- **Styckeformatering**
- **Textjustering (vänster, mitten, höger, marginal)**
- **Radavstånd och styckeavstånd**

#### Listor och Numrering
- **Punktlistor**
- **Numrerade listor**
- **Nästa listor**
- **Indrag och utdrag**

#### Länkar och Media
- **Länkinfogning och redigering**
- **Bilduppladdning och infogning**
- **Media (video, ljud)**
- **Länkmål och attribut**

#### Tabeller
- **Tabellskapande och redigering**
- **Rad- och kolumnhantering**
- **Cellformatering**
- **Tabellstil och layout**

#### Avancerade Funktioner
- **Kodredigering (HTML)**
- **Emoticons och symboler**
- **Kodexempel med syntaxmarkering**
- **Fördefinierade mallar**
- **Sidbrytningar**
- **Datum/tid infogning**
- **Sök och ersätt**
- **Visuella block**
- **Fullskärmsläge**

## 🔧 Variabelsystem

### Tillgängliga Variabler

#### Användarvariabler
```javascript
{{user.firstName}}        // Användarens förnamn
{{user.lastName}}         // Användarens efternamn
{{user.email}}           // Användarens e-postadress
{{user.customerNumber}}   // Kundnummer
{{user.phone}}           // Användarens telefonnummer
```

#### Bokningsvariabler
```javascript
{{booking.id}}              // Boknings-ID
{{booking.scheduledDate}}   // Bokningsdatum (YYYY-MM-DD)
{{booking.startTime}}       // Starttid (HH:MM)
{{booking.endTime}}         // Sluttid (HH:MM)
{{booking.status}}          // Bokningsstatus
{{booking.paymentStatus}}   // Betalningsstatus
{{booking.totalPrice}}      // Totalpris
```

#### Skolvariabler
```javascript
{{schoolName}}     // Skolans namn
{{schoolPhone}}    // Skolans telefonnummer
{{schoolEmail}}    // Skolans e-postadress
{{schoolAddress}}  // Skolans adress
{{appUrl}}         // Applikations-URL
```

#### Systemvariabler
```javascript
{{currentDate}}    // Aktuellt datum
{{currentTime}}    // Aktuell tid
{{systemName}}     // Systemnamn
{{version}}        // Systemversion
```

### Variabelinfogning

#### Metoder för att infoga variabler:

1. **Verktygsfältsknapp**: "Variabler" knappen i TinyMCE
2. **Högerklicksmeny**: "Variabler" i kontextmenyn
3. **Quickbars**: Tillgänglig i TinyMCE quickbars
4. **Automatisk infogning**: Välj text och använd variabelknapp
5. **Manuell inmatning**: Skriv variabeln direkt i HTML-koden

#### Variabelhantering i Kod

```javascript
// Exempel på variabelanvändning i mall
<h1>Välkommen till {{schoolName}}</h1>
<p>Hej {{user.firstName}} {{user.lastName}},</p>
<p>Din bokning den {{booking.scheduledDate}} kl. {{booking.startTime}}-{{booking.endTime}} är bekräftad.</p>
<p>Kontakt: {{schoolPhone}} | {{schoolEmail}}</p>
```

## 📸 Bildhantering

### Uppladdningssystem

#### API Endpoint
```
POST /api/admin/email-templates/upload-image
```

#### Uppladdningsparametrar
- **Metod**: `POST`
- **Content-Type**: `multipart/form-data`
- **Fil**: Bildfil (JPEG, PNG, GIF, WebP, SVG)
- **Maximal storlek**: 2MB
- **Målkatalog**: `/public/images/`

#### Svarformat
```json
{
  "success": true,
  "location": "/images/email-template_1234567890_abc123def456.jpg",
  "message": "Bild uppladdad framgångsrikt",
  "fileName": "email-template_1234567890_abc123def456.jpg",
  "size": 1256847,
  "type": "image/jpeg"
}
```

### Bildintegration i TinyMCE

#### Automatisk Uppladdningshanterare
```typescript
images_upload_handler: async (blobInfo) => {
  try {
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());

    const response = await fetch('/api/admin/email-templates/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Bilduppladdning misslyckades');
    }

    const data = await response.json();
    return data.location;
  } catch (error) {
    toast.error('Bilduppladdning misslyckades');
    throw error;
  }
}
```

### Bildoptimering

#### Rekommenderade Bildformat
- **JPEG**: För fotografier och komplexa bilder
- **PNG**: För bilder med transparens eller enkel grafik
- **WebP**: För optimal prestanda (stöds av moderna webbläsare)
- **SVG**: För vektorgrafik och ikoner

#### Bildstorleksrekommendationer
- **E-postmallar**: Max 600px bredd för responsivitet
- **Filstorlek**: Under 100KB för snabba laddningstider
- **Upplösning**: 72 DPI räcker för skärmvisning

## 📋 Fördefinierade Mallar

### 1. Standard E-postmall

#### Syfte
Grundläggande e-poststruktur för allmänna meddelanden.

#### Innehållsstruktur
```html
<h1>{{schoolName}}</h1>
<p>Hej {{user.firstName}},</p>
<p>Vi hoppas att detta meddelande når dig väl.</p>
<p>Med vänliga hälsningar,<br>{{schoolName}}</p>
<hr>
<p>{{schoolPhone}}<br>{{schoolEmail}}</p>
```

#### Användningsområden
- Allmänna informationsmeddelanden
- Välkomstmeddelanden
- Systemnotifieringar

### 2. Bokningsbekräftelse

#### Syfte
Bekräfta bokningar och visa viktig information.

#### Innehållsstruktur
```html
<h1>Bokningsbekräftelse</h1>
<p>Hej {{user.firstName}},</p>
<p>Din bokning har bekräftats med följande detaljer:</p>
<div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
  <p><strong>Bokningsnummer:</strong> {{booking.id}}</p>
  <p><strong>Datum:</strong> {{booking.scheduledDate}}</p>
  <p><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
  <p><strong>Status:</strong> {{booking.status}}</p>
</div>
<p>Vi ser fram emot att träffa dig!</p>
<p>Med vänliga hälsningar,<br>{{schoolName}}</p>
```

### 3. Påminnelse

#### Syfte
Påminna användare om kommande bokningar.

#### Innehållsstruktur
```html
<h1>Påminnelse</h1>
<p>Hej {{user.firstName}},</p>
<p>Detta är en påminnelse om din kommande bokning:</p>
<div style="background-color: #fff3e0; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #f57c00;">
  <p><strong>Datum:</strong> {{booking.scheduledDate}}</p>
  <p><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
  <p><strong>Bokningsnummer:</strong> {{booking.id}}</p>
</div>
<p>Vi ses snart!</p>
<p>Med vänliga hälsningar,<br>{{schoolName}}</p>
```

## 🎨 Användargränssnitt

### Layout och Design

#### Huvudlayout
- **Sidhuvud**: Mallinformation och verktygsfält
- **Editor**: TinyMCE WYSIWYG-editor
- **Sidopanel**: Mallista och variabelguide
- **Footer**: Spara/avbryt-knappar

#### Responsiv Design
```css
/* Mobilanpassning */
@media (max-width: 768px) {
  .editor-container {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    order: -1;
  }
}
```

### Navigering och Flöde

#### Mallhantering
1. **Välj mall**: Klicka på mall i listan eller skapa ny
2. **Redigera innehåll**: Använd TinyMCE för visuell redigering
3. **Infoga variabler**: Använd variabelknappar eller snabbkommandon
4. **Ladda upp bilder**: Använd bildknappen i editorn
5. **Förhandsgranska**: Visa hur mallen kommer att se ut
6. **Spara ändringar**: Bekräfta och spara mallen

#### Verktygsfält
- **Filoperationer**: Ny, spara, kopiera, ta bort
- **Redigeringsverktyg**: Ångra, gör om, sök/ersätt
- **Formatering**: Textstil, färg, justering
- **Infoga**: Bilder, länkar, tabeller, variabler
- **Visa**: Kod, förhandsgranskning, fullskärm

## 🔧 API Referens

### GET /api/admin/email-templates

**Beskrivning**: Hämtar lista över alla e-postmallar

**Svarformat**:
```json
{
  "templates": [
    {
      "id": "template-123",
      "triggerType": "booking_confirmed",
      "subject": "Din bokning är bekräftad",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/admin/email-templates/[id]

**Beskrivning**: Hämtar specifik e-postmall

**Parametrar**:
- `id`: Mallens ID

**Svarformat**:
```json
{
  "id": "template-123",
  "triggerType": "booking_confirmed",
  "subject": "Din bokning är bekräftad",
  "htmlContent": "<h1>Bokningsbekräftelse</h1><p>Hej {{user.firstName}}...</p>",
  "isActive": true,
  "receivers": ["student"],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### POST /api/admin/email-templates

**Beskrivning**: Skapar ny e-postmall

**Request Body**:
```json
{
  "triggerType": "booking_confirmed",
  "subject": "Din bokning är bekräftad",
  "htmlContent": "<h1>Bokningsbekräftelse</h1><p>Hej {{user.firstName}}...</p>",
  "isActive": true,
  "receivers": ["student"]
}
```

### PUT /api/admin/email-templates/[id]

**Beskrivning**: Uppdaterar befintlig e-postmall

**Parametrar**:
- `id`: Mallens ID

**Request Body**: Samma som POST

### POST /api/admin/email-templates/upload-image

**Beskrivning**: Laddar upp bild för användning i mallar

**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: Bildfil

**Svarformat**:
```json
{
  "success": true,
  "location": "/images/email-template_1234567890_abc123def456.jpg",
  "fileName": "email-template_1234567890_abc123def456.jpg",
  "size": 1256847,
  "type": "image/jpeg"
}
```

## ⚙️ Konfigurationsalternativ

### TinyMCE Konfiguration

#### Grundinställningar
```typescript
{
  height: 500,                    // Editorhöjd i pixlar
  menubar: true,                  // Visa menyrad
  language: 'sv_SE',             // Svenskt språk
  skin: 'oxide-dark',            // Mörkt tema
  content_css: 'dark',           // Mörkt innehållstema
  branding: false,               // Dölj TinyMCE varumärke
  promotion: false,              // Dölj TinyMCE promotion
}
```

#### Plugin-konfiguration
```typescript
plugins: [
  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
  'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
  'fullscreen', 'insertdatetime', 'media', 'table', 'help',
  'wordcount', 'codesample', 'emoticons', 'template', 'pagebreak',
  'nonbreaking', 'visualchars', 'quickbars', 'directionality', 'paste'
]
```

#### Verktygsfält-konfiguration
```typescript
toolbar: 'undo redo | blocks | bold italic forecolor backcolor | ' +
         'alignleft aligncenter alignright alignjustify | ' +
         'bullist numlist outdent indent | removeformat | help | ' +
         'image media link | code | preview | fullscreen | ' +
         'table | emoticons | codesample | template | pagebreak | ' +
         'insertdatetime | searchreplace | visualblocks | variables'
```

### Säkerhetsinställningar

#### Filuppladdning
```typescript
{
  images_upload_handler: async (blobInfo) => {
    // Validera filtyp
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(blobInfo.blob().type)) {
      throw new Error('Ogiltigt filformat');
    }

    // Kontrollera filstorlek
    if (blobInfo.blob().size > 2 * 1024 * 1024) { // 2MB
      throw new Error('Filen är för stor (max 2MB)');
    }

    // Ladda upp fil
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());

    const response = await fetch('/api/admin/email-templates/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Uppladdning misslyckades');
    }

    const data = await response.json();
    return data.location;
  }
}
```

## 🔒 Säkerhet

### Autentiseringskrav
- **Admin-åtkomst**: Endast användare med admin-roll kan komma åt editorn
- **API-skydd**: Alla API-anrop valideras med `requireAuth('admin')`
- **Session-hantering**: Automatisk utloggning vid inaktivitet

### Datavalidering
- **HTML-sanering**: Automatisk rensning av farlig HTML
- **Filvalidering**: Kontroll av filtyp och storlek
- **Innehållsfiltrering**: Validering av mallinnehåll
- **SQL-injection skydd**: Parameteriserade queries

### Backup-system
- **Automatisk backup**: Originalfiler sparas innan ändringar
- **Backup-namnkonvention**: `filename.backup.{timestamp}`
- **Rollback-funktionalitet**: Återställning vid fel
- **Versionshantering**: Spårning av ändringar över tid

## 🐛 Felsökning

### Vanliga Problem

#### Editorn laddar inte
**Symptom**: TinyMCE-editorn visas inte eller fungerar inte
**Lösningar**:
1. Kontrollera att alla beroenden är installerade
2. Verifiera att API-nyckeln inte används (TinyMCE Community är gratis)
3. Kontrollera konsolen för JavaScript-fel
4. Säkerställ att DOM-elementet finns när editorn initieras

#### Bilder laddas inte upp
**Symptom**: Bilduppladdning misslyckas eller bilder visas inte
**Lösningar**:
1. Kontrollera att `/public/images/` mappen finns och är skrivbar
2. Verifiera API-endpoint för bilduppladdning
3. Kontrollera filstorlek och format
4. Se till att servern har rätt behörigheter

#### Variabler fungerar inte
**Symptom**: Variabler visas inte korrekt i skickade e-postmeddelanden
**Lösningar**:
1. Kontrollera syntax: `{{variableName}}`
2. Verifiera att variabeln finns i systemet
3. Kontrollera att mallprocessorn fungerar korrekt
4. Testa variabeln i förhandsgranskningsläge

#### Mallar sparas inte
**Symptom**: Ändringar sparas inte eller fel uppstår vid sparning
**Lösningar**:
1. Kontrollera att användaren har admin-rättigheter
2. Verifiera API-endpoint för mallssparande
3. Kontrollera databasanslutning
4. Se till att backup-systemet fungerar

### Debug-läge

#### Aktivera Debug
```typescript
// I TinyMCE konfiguration
{
  // ... andra inställningar
  debug: true,                    // Aktivera debug-läge
  log_level: 'error',            // Loggnivå
  log_path: '/logs/tinymce.log'  // Loggfil (server)
}
```

#### Debug-konsol
```javascript
// I webbläsarkonsolen
tinymce.activeEditor.getContent();        // Hämta nuvarande innehåll
tinymce.activeEditor.setContent('HTML');  // Sätta nytt innehåll
tinymce.activeEditor.execCommand('mceInsertContent', false, 'text'); // Infoga text
```

## 📊 Prestandaoptimering

### Laddningstider
- **Lazy loading**: Editorn laddas bara när den behövs
- **Koddelning**: TinyMCE moduler laddas på begäran
- **Cache**: Webbläsarcache för TinyMCE-filer
- **CDN**: Använd TinyMCE från CDN för bättre prestanda

### Minneshantering
- **Event cleanup**: Automatisk rensning av event listeners
- **DOM cleanup**: Rensa DOM-element vid komponentavmontering
- **Memory leaks**: Förhindra minnesläckor genom proper cleanup

### Optimeringstips
1. **Minska antalet plugins**: Endast ladda nödvändiga plugins
2. **Optimera verktygsfält**: Anpassa toolbar för specifika behov
3. **Komprimera bilder**: Automatisk bildkomprimering
4. **Cache-strategi**: Implementera cache för frekvent använda mallar

## 🔮 Framtida Utökningar

### Planerade Funktioner
- **Versionshantering**: Spåra malländringar över tid
- **A/B-testning**: Testa olika mallvarianter
- **AI-assistent**: Automatisk mallgenerering
- **Export/Import**: Dela mallar mellan instanser
- **Real-time collaboration**: Flera användare kan redigera samtidigt
- **Template marketplace**: Gemensam mallbibliotek

### Tekniska Förbättringar
- **Plugin-utveckling**: Anpassade TinyMCE-plugins
- **Template engine**: Avancerad variabelhantering
- **Cache-system**: Snabbare laddning av mallar
- **Real-time sync**: Live-synkronisering mellan användare

## 📚 Referenser

### TinyMCE Dokumentation
- [TinyMCE Documentation](https://www.tiny.cloud/docs/)
- [TinyMCE React Integration](https://www.tiny.cloud/docs/tinymce/6/react/)
- [TinyMCE Configuration](https://www.tiny.cloud/docs/configure/)

### React Hook Form
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Schema Validation](https://zod.dev/)

### UI Bibliotek
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [React Hot Toast](https://react-hot-toast.com/)

### E-poststandarder
- [Email Design Guidelines](https://www.campaignmonitor.com/css/)
- [Email Testing Tools](https://www.emailonacid.com/)
- [Email Accessibility](https://www.emailaccessibilitychecker.com/)

## 🏷️ Taggar

**Tekniska taggar**: TinyMCE, WYSIWYG, React, TypeScript, Email Templates, Admin Interface, Swedish Localization, Image Upload, Variable System

**Funktionella taggar**: E-postredigering, Mallhantering, Bilduppladdning, Variabelsystem, Förhandsgranskning, Backup-system, Admin-panel

---

*Senast uppdaterad: 2024-12-22*
*Dokumentation för AI och utvecklare*
