# E-postmallredigerare med TinyMCE

Denna komponent har byggts om för att använda **TinyMCE** som WYSIWYG-editor istället för den tidigare enkla textarea-komponenten. Detta ger en professionell och användarvänlig upplevelse för att skapa och redigera e-postmallar.

## 🎯 Funktioner

### ✨ Huvudfunktioner
- **TinyMCE WYSIWYG Editor**: Professionell editor med svensk språkstöd
- **Dark Mode**: Optimiserad för mörkt tema i admin-interfacet
- **Svenskt Gränssnitt**: Alla knappar och menyer på svenska
- **Bilduppladdning**: Direkt uppladdning till `/public/images/`
- **Variabelstöd**: Enkel infogning av dynamiska variabler
- **Förhandsgranskning**: Live preview av mallar
- **E-postmallar**: Fördefinierade mallar för olika ändamål

### 🖋️ Editorfunktioner
- **Formatering**: Fetstil, kursiv, understrykning, genomstrykning
- **Textfärg**: Bakgrunds- och textfärg
- **Justering**: Vänster, mitten, höger, marginal
- **Listor**: Punktlistor och numrerade listor
- **Länkar**: Infoga och redigera länkar
- **Bilder**: Infoga och hantera bilder
- **Tabeller**: Skapa och redigera tabeller
- **Kod**: Visa och redigera HTML-kod
- **Emoticons**: Infoga emojis och symboler
- **Kodexempel**: Syntax-färgning för kodblock
- **Mallar**: Fördefinierade e-postmallar
- **Sidbrytningar**: Infoga sidbrytningar
- **Datum/tid**: Infoga aktuella datum och tider
- **Sök och ersätt**: Sök och ersätt text
- **Visuella block**: Visa strukturella element
- **Fullskärm**: Redigera i fullskärmsläge
- **Förhandsgranskning**: Förhandsgranska innan sparning

## 🏗️ Teknisk Implementation

### 📦 Beroenden
```json
{
  "@tinymce/tinymce-react": "^5.x.x",
  "tinymce": "^6.x.x"
}
```

### ⚙️ Konfiguration

#### TinyMCE Init-konfiguration
```typescript
init={{
  height: 500,
  menubar: true,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample',
    'emoticons', 'template', 'pagebreak', 'nonbreaking', 'visualchars',
    'quickbars', 'directionality', 'paste'
  ],
  toolbar: 'undo redo | blocks | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help | image media link | code | preview | fullscreen | table | emoticons | codesample | template | pagebreak | insertdatetime | searchreplace | visualblocks | variables',
  language: 'sv_SE',
  skin: 'oxide-dark',
  content_css: 'dark',
  branding: false,
  promotion: false,
  // ... more configuration
}}
```

### 🎨 Anpassningar

#### E-postspecifika funktioner
- **Variabelknapp**: Anpassad knapp för att infoga variabler
- **E-postmallar**: Fördefinierade mallar för olika e-posttyper
- **E-post-CSS**: Optimerad styling för e-post
- **Variabel-highlighting**: Visuell markering av variabler
- **Klistra-special**: Smart hantering av inklistrad text

#### Svenska översättningar
- Alla editor-knappar på svenska
- Anpassade tooltips och hjälptexter
- Svensk dokumentation och felmeddelanden

### 📸 Bildhantering

#### Uppladdning
- **API Endpoint**: `/api/admin/email-templates/upload-image`
- **Målkatalog**: `/public/images/`
- **Filnamn**: Automatisk generering med prefix `email-template_`
- **Format**: JPEG, PNG, GIF, WebP, SVG
- **Storlek**: Max 2MB (optimerat för e-post)

#### Integration
```typescript
images_upload_handler: async (blobInfo) => {
  const formData = new FormData();
  formData.append('file', blobInfo.blob(), blobInfo.filename());

  const response = await fetch('/api/admin/email-templates/upload-image', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.location;
}
```

### 🔧 Variabelstöd

#### Tillgängliga variabler
```javascript
// Användarvariabler
{{user.firstName}}     // Användarens förnamn
{{user.lastName}}      // Användarens efternamn
{{user.email}}         // Användarens e-post
{{user.customerNumber}} // Kundnummer

// Bokningsvariabler
{{booking.id}}              // Boknings-ID
{{booking.scheduledDate}}   // Bokningsdatum
{{booking.startTime}}       // Starttid
{{booking.endTime}}         // Sluttid

// Skolvariabler
{{schoolName}}   // Skolans namn
{{schoolPhone}}  // Skolans telefon
{{schoolEmail}}  // Skolans e-post
{{appUrl}}       // Applikations-URL
```

#### Variabelinfogning
- **Knapp**: "Variabler" i verktygsfältet
- **Genväg**: Högerklicka → "Variabler"
- **Quickbars**: Snabbåtkomst i quickbars
- **Automatisk**: Markera text och klicka på variabelknapp

### 📋 Fördefinierade Mallar

#### 1. Standard e-postmall
- Grundläggande e-poststruktur
- Header, main content och footer
- Responsive design
- Variabelintegration

#### 2. Bokningsbekräftelse
- Bekräftelselayout
- Bokningsdetaljer
- Call-to-action
- Professionell styling

#### 3. Påminnelse
- Påminnelselayout
- Tidsinformation
- Viktig markering
- Enkel design

### 🎨 Styling och Tema

#### Dark Mode Support
```css
/* Editor dark mode */
body {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

/* Variable highlighting */
.variable {
  background: #1a237e;
  border-color: #64b5f6;
  color: #64b5f6;
}
```

#### E-postspecifika stilar
```css
.email-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  text-align: center;
  border-radius: 10px;
  margin-bottom: 20px;
}

.email-content {
  background: #f9f9f9;
  padding: 25px;
  border-radius: 8px;
  margin: 20px 0;
}

.email-footer {
  text-align: center;
  padding: 20px;
  background: #f5f5f5;
  font-size: 12px;
  color: #666;
  border-radius: 5px;
}
```

## 🚀 Användning

### Grundläggande redigering
1. **Öppna editorn**: Gå till E-postmallar i admin
2. **Välj mall**: Klicka på en befintlig mall eller skapa ny
3. **Redigera innehåll**: Använd WYSIWYG-editorn
4. **Infoga variabler**: Använd variabelknappen eller snabbkommandon
5. **Ladda upp bilder**: Använd bildknappen i editorn
6. **Förhandsgranska**: Klicka på fliken "Förhandsgranska"
7. **Spara**: Klicka på "Spara mall"

### Avancerade funktioner
1. **HTML-redigering**: Använd "Code"-knappen för direkt HTML
2. **Tabeller**: Infoga och formatera tabeller
3. **Mallar**: Använd fördefinierade mallar som startpunkt
4. **Sök/ersätt**: Använd sök- och ersättfunktionen
5. **Visual blocks**: Aktivera för att se strukturella element

## 🔒 Säkerhet

### Autentisering
- **Admin-krav**: Endast admin-användare kan komma åt editorn
- **API-skydd**: Alla API-anrop verifieras med `requireAuth('admin')`

### Datahantering
- **Backup**: Automatisk backup av originalfiler
- **Validering**: Innehållsvalidering innan sparning
- **Filnamn**: Säkra filnamn för uppladdade bilder
- **Storleksgräns**: Begränsningar för filuppladdningar

## 🐛 Felsökning

### Vanliga problem

#### Editorn laddar inte
**Lösning**:
```bash
# Kontrollera att beroenden är installerade
npm list @tinymce/tinymce-react tinymce

# Om inte installerat:
npm install @tinymce/tinymce-react tinymce
```

#### Bilder laddas inte upp
**Lösning**:
```bash
# Kontrollera att images-mappen finns
ls -la public/images/

# Kontrollera API endpoint
curl -X POST /api/admin/email-templates/upload-image
```

#### Variabler fungerar inte
**Lösning**:
- Kontrollera syntax: `{{variableName}}`
- Använd variabelknappen istället för manuell inmatning
- Kontrollera att variabeln finns i systemet

#### Dark mode fungerar inte
**Lösning**:
- Kontrollera att `content_css: 'dark'` är inställt
- Se till att editorn har rätt CSS-klasser

## 📈 Prestanda

### Optimeringar
- **Lazy loading**: Editorn laddas bara när den behövs
- **Minimal re-rendering**: Effektiv state-hantering
- **Asynkron bilduppladdning**: Non-blocking uploads
- **Memory management**: Rätt städning av event listeners

### Rekommendationer
- Använd förhandsgranskning innan sparning
- Begränsa bildstorlekar för bättre prestanda
- Använd mallar som startpunkt för nya mallar
- Testa mallar med olika innehållstyper

## 🔮 Framtida förbättringar

### Planerade funktioner
- **Live preview**: Realtidsförhandsgranskning
- **Versionshantering**: Spåra malländringar
- **A/B-testning**: Testa olika mallvarianter
- **AI-assistent**: Automatisk mallgenerering
- **Export/Import**: Dela mallar mellan instanser
- **Responsive testing**: Förhandsgranska på olika enheter

### Tekniska förbättringar
- **Plugin-utveckling**: Anpassade TinyMCE-plugins
- **Template engine**: Avancerad variabelhantering
- **Cache-system**: Snabbare laddning av mallar
- **Real-time collaboration**: Flera användare kan redigera samtidigt
