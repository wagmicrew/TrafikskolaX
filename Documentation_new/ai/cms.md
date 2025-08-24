# CMS (Content Management System)

Detta dokument beskriver det nya CMS-systemet för Trafikskola X, som möjliggör dynamisk hantering av sidor, menyer och innehåll.

## Översikt

CMS-systemet består av följande komponenter:

- **Sidor (Pages)**: Dynamiska sidor som lagras i databasen med WYSIWYG-redigering
- **Meny (Menu)**: Dynamisk menyhantering för navigation
- **Bilduppladdning**: Integration med TinyMCE för bildhantering
- **Admin-gränssnitt**: Komplett admin-panel för innehållshantering

## Databasschema

### Pages Table
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,           -- URL-slug (t.ex. 'hem', 'om-oss')
  title VARCHAR(255) NOT NULL,                 -- Sidtitel
  content TEXT,                                -- Sidinnehåll (HTML från TinyMCE)
  excerpt TEXT,                                -- Sammanfattning
  meta_title VARCHAR(255),                     -- SEO-titel
  meta_description TEXT,                       -- SEO-beskrivning
  status VARCHAR(20) DEFAULT 'draft',          -- 'draft', 'published', 'archived'
  is_static BOOLEAN DEFAULT FALSE,             -- Om sidan är statisk från filsystem
  static_path VARCHAR(255),                    -- Sökväg till statisk fil
  author_id UUID,                              -- Skapare av sidan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Menu Items Table
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES menu_items(id),     -- För kapslade menyer
  label VARCHAR(255) NOT NULL,                  -- Menytext
  url VARCHAR(255),                             -- URL eller slug
  page_id UUID REFERENCES pages(id),            -- Länk till en sida
  is_external BOOLEAN DEFAULT FALSE,            -- Extern länk
  icon VARCHAR(100),                            -- Ikonnamn (Lucide)
  sort_order INTEGER DEFAULT 0,                 -- Sorteringsordning
  is_active BOOLEAN DEFAULT TRUE,               -- Aktiv/inaktiv
  is_admin_menu BOOLEAN DEFAULT FALSE,          -- Admin-meny eller huvudmeny
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Page Images Table
```sql
CREATE TABLE page_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id),   -- Länkat till sida
  filename VARCHAR(255) NOT NULL,               -- Unikt filnamn
  original_name VARCHAR(255) NOT NULL,          -- Ursprungligt namn
  path VARCHAR(500) NOT NULL,                   -- Sökväg i /public/images
  size INTEGER NOT NULL,                        -- Filstorlek i bytes
  mime_type VARCHAR(100) NOT NULL,              -- MIME-typ
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Sidhantering
- `GET /api/admin/cms/pages` - Lista alla sidor
- `POST /api/admin/cms/pages` - Skapa ny sida
- `GET /api/admin/cms/pages/[id]` - Hämta specifik sida
- `PUT /api/admin/cms/pages/[id]` - Uppdatera sida
- `DELETE /api/admin/cms/pages/[id]` - Radera sida

### Menyhantering
- `GET /api/admin/cms/menu` - Lista alla menyobjekt
- `POST /api/admin/cms/menu` - Skapa nytt menyobjekt
- `GET /api/admin/cms/menu/[id]` - Hämta menyobjekt
- `PUT /api/admin/cms/menu/[id]` - Uppdatera menyobjekt
- `DELETE /api/admin/cms/menu/[id]` - Radera menyobjekt

### Bilduppladdning
- `POST /api/admin/cms/upload` - Ladda upp bild för TinyMCE

### Publik åtkomst
- `GET /api/menu` - Hämta huvudmeny för frontend

## Admin-menystruktur

```
Hemsidan (Dropdown)
├── Sidredigerare (/dashboard/admin/cms)
├── Menyredigerare (/dashboard/admin/cms)
├── E-postmallar (/dashboard/admin/settings/email)
├── Inställningar (/dashboard/admin/settings)
├── Databashantering (/dashboard/admin/settings/database-updates)
└── Setuphjälp (/dashboard/admin/setup)

Bokningar (Dropdown)
├── Aktuella Bokningar (/dashboard/admin/bookings)
├── Arkiverade Bokningar (/dashboard/admin/bookings-old)
├── Bokningsverktyg (/dashboard/admin/booking-tools)
├── Bokningsinställningar (/dashboard/admin/booking-settings)
└── Fakturor (/dashboard/admin/invoices)

Användare (/dashboard/admin/users)

Skolan (Dropdown)
├── Lektioner & Paket (/dashboard/admin/lessons)
├── Lektionsinnehåll (/dashboard/admin/lesson-content)
├── Öppettider (/dashboard/admin/slots)
├── Teorihantering (/dashboard/admin/teori-lesson-types)
└── Sessionshantering (/dashboard/admin/teori-sessions)

Betalningar (Dropdown)
├── Qliro (/dashboard/admin/payments/qliro)
├── Swish (/dashboard/admin/payments/swish)
└── Bankgiro (/dashboard/admin/payments/bankgiro)
```

## Komponenter

### Admin Components
- `app/dashboard/admin/cms/page.tsx` - Huvudsidan för CMS
- `app/dashboard/admin/setup/page.tsx` - Setup-hjälp

### Frontend Components
- `components/ui/dynamic-menu.tsx` - Dynamisk meny-komponent
- `app/[slug]/page.tsx` - Dynamisk sid-renderare

## TinyMCE Integration

### Konfiguration
- Svenskt gränssnitt (`language: 'sv_SE'`)
- Automatisk bilduppladdning
- Klistra in bilder direkt
- Utökade verktygsfält
- Responsiv design

### Bildhantering
- Bilder sparas i `/public/images/`
- Automatisk generering av unika filnamn
- MIME-type validering
- Storleksbegränsning (5MB)
- Tillåtna format: JPEG, PNG, GIF, WebP

## Setup Process

### Automatisk Setup
1. Gå till `/dashboard/admin/setup`
2. Kontrollera status för varje komponent
3. Klicka på "Skapa" för komponenter som saknas

### Manuella Steg
1. Kör `node scripts/create-cms-tables.js` för att skapa tabeller
2. Kör `node scripts/cms-system.sql` i Neon om Node.js-skriptet misslyckas
3. Skapa `/public/images/` katalog för bilduppladdningar

## Användning

### Skapa en ny sida
1. Gå till Admin → Hemsidan → Sidredigerare
2. Klicka "Skapa ny sida"
3. Fyll i titel, slug och innehåll
4. Spara som utkast eller publicera direkt

### Hantera menyn
1. Gå till Admin → Hemsidan → Menyredigerare
2. Lägg till, redigera eller ta bort menyobjekt
3. Ordna med sorteringsordning
4. Länka till sidor eller externa URL:er

### Redigera innehåll
1. Använd TinyMCE-editorn för WYSIWYG-redigering
2. Ladda upp bilder direkt i editorn
3. Förhandsgranska innan publicering
4. Hantera SEO-inställningar

## Säkerhet

- Alla admin-endpoints kräver `admin`-roll
- Bilduppladdning validerar MIME-typer
- Filnamn saneras och görs unika
- SQL-injektion skydd genom Drizzle ORM
- XSS-skydd genom TinyMCE:s inbyggda sanering

## Prestanda

- Index på viktiga kolumner (slug, status, sort_order)
- Lazy loading av meny-komponenter
- Caching av statiska resurser
- Optimering av bildleverans

## Felsökning

### Vanliga Problem

1. **Sidor visas inte**
   - Kontrollera att status är 'published'
   - Verifiera att slug inte innehåller specialtecken
   - Kontrollera att dynamisk routing fungerar

2. **Bilder laddas inte upp**
   - Kontrollera att `/public/images/` existerar
   - Verifiera filstorlek (< 5MB)
   - Kontrollera MIME-typ

3. **Meny visas inte**
   - Kontrollera att menyobjekt är aktiva
   - Verifiera sort_order
   - Kontrollera API-anslutning

### Debug-kommandon
```bash
# Kontrollera databastabeller
node -e "const {db} = require('./lib/db'); db.select().from(require('./lib/db/schema').pages).then(console.log)"

# Testa meny-API
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/menu

# Kontrollera bildkatalog
ls -la public/images/
```

## Utvidgningar

### Framtida Förbättringar
- Kapslade menyer (parent-child relationer)
- Versionshantering av sidor
- Schemalagd publicering
- Användarbehörigheter per sida
- SEO-optimering och analytics
- Import/export av innehåll
- Flerspråkigt stöd

### Integrationer
- E-postmarknadsföring
- Social media delning
- Sökmotoroptimering
- Analytics och tracking
- CDN för bilder och assets

## Support

Vid frågor eller problem:
1. Kontrollera setup-status på `/dashboard/admin/setup`
2. Verifiera databasanslutning
3. Kontrollera serverloggar
4. Kontrollera att alla npm-paket är installerade

## Changelog

### Version 1.0.0
- Initial release
- Grundläggande sid- och menyhantering
- TinyMCE integration
- Bilduppladdning
- Admin UI
- Setup automation
