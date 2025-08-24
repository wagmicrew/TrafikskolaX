## Faktureringssystem (Invoices)

Denna sida beskriver faktureringssystemet och hur det kopplas till bokningar (körlektioner och sessions), betalningar (Swish/Qliro), PDF-generering samt admin- och kundgränssnitt.

### Översikt

- Tabeller: `invoices`, `invoice_items`
- API:
  - Admin: `/api/admin/invoices`, `/api/admin/invoices/[id]`, `/api/admin/invoices/[id]/pay`, `/api/admin/invoices/[id]/remind`, `/api/admin/invoices/[id]/pdf`, `/api/admin/invoices/test-pdf`
  - Kund: `/api/invoices`, `/api/invoices/[id]`, `/api/invoices/[id]/pdf`
- UI:
  - Admin: `dashboard/admin/invoices` (lista) och `dashboard/admin/invoices/[id]` (detalj)
  - Kund: `dashboard/invoices` (lista) och `dashboard/invoices/[id]` (detalj)
- PDF: `lib/services/invoice-pdf-service.ts` (svensk layout, SEK, företagets uppgifter)
- Setup: Admin Inställningar → fliken "Inställningar" (Setup) innehåller fakturasetup, status och testknappar

### Databas

`invoices` (urval):
- `invoice_number` (format `INV-YYYYMM-####`, genereras via `generate_invoice_number()` och sekvens)
- `customer_id`, `customer_email`, `customer_name`, `customer_phone`
- `amount` (DECIMAL), `currency` (`SEK` i UI), `status` (`pending|paid|overdue|cancelled|error`)
- `payment_method` (`swish|qliro|credits|...`), relationer till bokning/session
- `issued_at`, `due_date`, `paid_at`, `last_reminder_sent`, `reminder_count`

`invoice_items` innehåller rader (beskrivning, antal, à-pris, totalpris) och valfri referens.

### Skapande av faktura

Automatiskt vid:
- Körlektioner: `app/api/booking/create/route.ts`
  - Icke-kreditbetalningar: skapar `pending` faktura.
  - Admin/teacher med `alreadyPaid`: faktura markeras som betald.
- Sessions (Teori/Handledare): `app/api/sessions/[id]/book/route.ts`
  - Icke-kreditbetalningar: skapar faktura för session-bokningen.

Gemensam service: `lib/services/booking-invoice-service.ts`:
- `createBookingInvoice`, `createSessionInvoice`, `markInvoicePaid`, `sendPaymentReminder` m.fl.

### Betalningar och webhooks

- Swish webhook: `POST /api/payments/swish/webhook` → anropar `bookingInvoiceService.handlePaymentConfirmation(...)`.
- Qliro webhook: `POST /api/payments/qliro/webhook` → hanterar orderstatus, stöd för `booking_...`, `handledar_...` och `INV-...` (fakturor).
- Admin kan markera faktura som betald via `POST /api/admin/invoices/[id]/pay`.

### PDF

- Genereras med `invoicePDFService` (jsPDF + autotable). Svenska texter, SEK och företagsinfo.
- Admin: ladda ned via invoice-detalj eller `GET /api/admin/invoices/[id]/pdf`.
- Kund: ladda ned via `GET /api/invoices/[id]/pdf`.

### UI / Navigering

- Admin: meny `Fakturor` → lista + detalj (markera betald, skicka påminnelse, ladda ned PDF).
- Kund: `Dashboard > Fakturor` → lista + detalj, knapp "Betala nu" (framtida checkout), PDF.

### Setup & Test

Inställningar → fliken "Inställningar" (Setup) innehåller:
- Systemstatus (kontroll av API/statistik)
- Initiera fakturasystem (skapar tabeller/sekvens om saknas)
- Återställ (för test)
- Generera test-PDF
- Testa Swish/Qliro (simulerade tester)

### Påminnelser

- `invoiceService.getOverdueInvoices()` listar försenade.
- `invoiceService.sendReminder(id)` sätter `last_reminder_sent`, ökar `reminder_count` och returnerar data för e-post.
- Rekommenderad cron: hämta försenade dagligen och skicka påminnelse.

### Koppling till bokningar

- Faktura skapas när bokningen skapas (om inte credits).
- När betalning bekräftas (webhook/admin) markeras fakturan som `paid`. Koppla gärna uppdatering av relaterad bokning/session till `confirmed` i samma flöde.

### Design/UI-regler

- Alltid SEK i UI. Använd mynt-/butiksikon, undvik $, £, €.
- Följ `Documentation_new/ui.md` för typografi/färger.

### Felhantering

- API returnerar `error` i JSON och loggar serverfel.
- Webhooks kvitterar okända referenser (undviker timeout) och loggar.

### Vidare arbete

- Fullständig kundbetalning (Swish QR/redirect, Qliro checkout) från fakturasidor.
- Cron-jobb för automatiska påminnelser.
- Direktuppdatering av relaterad bokning/session i `handlePaymentConfirmation` när referenser knyts.


