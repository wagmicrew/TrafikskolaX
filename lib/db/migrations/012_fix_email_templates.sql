-- Ensure reminder and swish verification templates exist, are active, and have receivers

-- Note: Enum values should already exist from previous migrations (009/010).
-- We intentionally avoid ALTER TYPE here because some runners batch statements oddly.

-- Handledar payment reminder
INSERT INTO email_templates (trigger_type, subject, html_content, is_active)
VALUES (
  'handledar_payment_reminder',
  'Påminnelse: Betalning för handledarutbildning ({{booking.shortId}})',
  '<p>Hej {{user.firstName}}!</p>
   <p>Vi saknar din betalning för handledarutbildningen (Booking {{booking.shortId}}).</p>
   <p><a href="{{links.handledarPaymentUrl}}" style="background:#dc2626;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">Öppna betalningssida</a></p>
   <p>Tack!</p>',
  true
)
ON CONFLICT (trigger_type)
DO UPDATE SET subject = EXCLUDED.subject,
              html_content = EXCLUDED.html_content,
              is_active = TRUE,
              updated_at = NOW();

-- Booking payment reminder (keep branded content)
INSERT INTO email_templates (trigger_type, subject, html_content, is_active)
VALUES (
  'booking_payment_reminder',
  'Påminnelse: Slutför din bokningsbetalning ({{booking.shortId}})',
  '<div style="max-width:680px;margin:0 auto;background:#0b1220;color:#fff;border-radius:16px;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
     <div style="background:linear-gradient(180deg,#ef4444 0%,#991b1b 100%);padding:20px 24px;">
       <h1 style="margin:0;font-size:20px;line-height:1.2;">Slutför din betalning</h1>
       <p style="margin:6px 0 0;opacity:.9;">Bokning <strong>{{booking.shortId}}</strong></p>
     </div>
     <div style="padding:20px 24px;background:#0b1220;">
       <p>Hej {{user.firstName}}!</p>
       <p>Vi saknar din betalning för din kommande bokning. Använd knappen nedan för att öppna betalningssidan.</p>
       <div style="margin:16px 0;text-align:center;">
         <a href="{{links.bookingPaymentUrl}}" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Öppna betalningssida</a>
       </div>
       <div style="margin:18px 0;padding:12px 14px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.04);">
         <div style="display:flex;gap:16px;flex-wrap:wrap;">
           <div style="min-width:180px;">
             <div style="opacity:.7;font-size:12px;">Datum</div>
             <div style="font-weight:600;">{{booking.scheduledDate}}</div>
           </div>
           <div style="min-width:180px;">
             <div style="opacity:.7;font-size:12px;">Tid</div>
             <div style="font-weight:600;">{{booking.startTime}}–{{booking.endTime}}</div>
           </div>
           <div style="min-width:180px;">
             <div style="opacity:.7;font-size:12px;">Belopp</div>
             <div style="font-weight:600;">{{booking.totalPrice}} kr</div>
           </div>
         </div>
       </div>
       <p style="opacity:.9;">Om du redan har betalat kan du bortse från detta meddelande.</p>
       <p style="opacity:.9;">Vänliga hälsningar,<br/>Din Trafikskola Hässleholm</p>
     </div>
   </div>',
  true
)
ON CONFLICT (trigger_type)
DO UPDATE SET subject = EXCLUDED.subject,
              html_content = EXCLUDED.html_content,
              is_active = TRUE,
              updated_at = NOW();

-- Package payment reminder
INSERT INTO email_templates (trigger_type, subject, html_content, is_active)
VALUES (
  'package_payment_reminder',
  'Påminnelse: Betalning för paket',
  '<p>Hej {{user.firstName}}!</p>
   <p>Vi saknar din betalning för ditt paketköp.</p>
   <p><a href="{{links.packagesPaymentUrl}}" style="background:#dc2626;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">Öppna betalningssida</a></p>
   <p>Tack!</p>',
  true
)
ON CONFLICT (trigger_type)
DO UPDATE SET subject = EXCLUDED.subject,
              html_content = EXCLUDED.html_content,
              is_active = TRUE,
              updated_at = NOW();

-- Swish verification template: ensure active and content minimally present
INSERT INTO email_templates (trigger_type, subject, html_content, is_active)
VALUES (
  'swish_payment_verification',
  'Betalningskontroll krävs',
  '<p>Hej!</p>
   <p>En betalning behöver bekräftas.</p>
   <p><a href="{{links.adminModerationUrl}}" style="background:#16a34a;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">Öppna bekräftelsesidan</a></p>
   <p>Booking: {{booking.shortId}}</p>',
  true
)
ON CONFLICT (trigger_type)
DO UPDATE SET subject = EXCLUDED.subject,
              html_content = EXCLUDED.html_content,
              is_active = TRUE,
              updated_at = NOW();

-- Receivers: reminders -> student
WITH t AS (
  SELECT id, trigger_type FROM email_templates WHERE trigger_type IN ('handledar_payment_reminder','booking_payment_reminder','package_payment_reminder')
)
INSERT INTO email_receivers (template_id, receiver_type)
SELECT t.id, 'student'::email_receiver_type FROM t
WHERE NOT EXISTS (
  SELECT 1 FROM email_receivers r WHERE r.template_id = t.id AND r.receiver_type = 'student'
);

-- Receivers: swish verification -> admin + school
WITH s AS (
  SELECT id FROM email_templates WHERE trigger_type = 'swish_payment_verification'
)
INSERT INTO email_receivers (template_id, receiver_type)
SELECT s.id, 'admin'::email_receiver_type FROM s
WHERE NOT EXISTS (
  SELECT 1 FROM email_receivers r WHERE r.template_id = s.id AND r.receiver_type = 'admin'
);

WITH s2 AS (
  SELECT id FROM email_templates WHERE trigger_type = 'swish_payment_verification'
)
INSERT INTO email_receivers (template_id, receiver_type)
SELECT s2.id, 'school'::email_receiver_type FROM s2
WHERE NOT EXISTS (
  SELECT 1 FROM email_receivers r WHERE r.template_id = s2.id AND r.receiver_type = 'school'
);


