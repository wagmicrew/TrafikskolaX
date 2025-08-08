# Tidsluckor Uppdatering - 2025-08-08

## Beskrivning
Uppdatering av slot_settings tabellen med nya tidsluckor för körskolan via Excel-import.

## Ändringar
- ✅ Skapad Excel-import funktion för slot_settings tabellen
- ✅ Truncate-funktionalitet implementerad
- ✅ Dummy Excel-fil skapad för måndag till söndag
- ✅ Validering av Excel-data implementerad

## Teknisk Information
- **Datum**: 2025-08-08
- **Tabell**: slot_settings
- **Operation**: Excel-import med valfri truncate
- **Schema**: Samma tidsluckor för alla veckodagar (måndag-söndag)
- **Excel-format**: dayOfWeek, timeStart, timeEnd, isActive

## Status
- ✅ Excel-import funktion skapad
- ✅ Truncate-funktionalitet implementerad
- ✅ Dummy Excel-fil skapad
- ✅ Validering av data implementerad
- ✅ Verifiering att tidsluckorna visas korrekt i bokningssystemet

## Användning

### Skapa Dummy Excel-fil
```bash
npx tsx scripts/import-slot-settings.ts create-dummy
```

### Importera från Excel (utan truncate)
```bash
npx tsx scripts/import-slot-settings.ts import dummy-slot-settings.xlsx
```

### Importera från Excel (med truncate)
```bash
npx tsx scripts/import-slot-settings.ts import dummy-slot-settings.xlsx --truncate
```

## Excel-format
Excel-filen ska innehålla följande kolumner:
- **dayOfWeek**: 0=Söndag, 1=Måndag, 2=Tisdag, etc.
- **timeStart**: Format HH:MM (t.ex. "08:00")
- **timeEnd**: Format HH:MM (t.ex. "09:00")
- **isActive**: true/false (valfritt, standard är true)

## Validering
Scriptet validerar:
- Alla obligatoriska fält finns
- dayOfWeek är mellan 0-6
- Tidsformat är korrekt (HH:MM)
- Sluttid är efter starttid
- Hoppar över ogiltiga rader med varning

## Bifogad Bild
Bilden visar de nya tidsluckorna som ska implementeras i systemet.

## Filer Skapade
- `scripts/import-slot-settings.ts` - Excel-import script
- `dummy-slot-settings.xlsx` - Exempel Excel-fil
- `changes/tidsluckor-uppdatering-2025-08-08.md` - Denna dokumentation
