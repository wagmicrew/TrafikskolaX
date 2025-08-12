-- Extend enum if not exists (safe pattern)
-- Extend enum values (no DO block)
ALTER TYPE email_trigger_type ADD VALUE IF NOT EXISTS 'handledar_payment_reminder';
ALTER TYPE email_trigger_type ADD VALUE IF NOT EXISTS 'booking_payment_reminder';
ALTER TYPE email_trigger_type ADD VALUE IF NOT EXISTS 'package_payment_reminder';

-- Insert templates if not exist
INSERT INTO email_templates (trigger_type, subject, html_content, is_active)
VALUES ('handledar_payment_reminder', 'Påminnelse: Betalning för handledarutbildning',
  '<p>Hej {{user.firstName}}!</p>
   <p>Vi saknar din betalning för handledarutbildningen (Booking {{booking.shortId}}).</p>
   <p><a href="{{links.handledarPaymentUrl}}" style="background:#dc2626;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">Öppna betalningssida</a></p>
   <p>Tack!</p>', true)
ON CONFLICT (trigger_type)
DO NOTHING;

INSERT INTO email_templates (trigger_type, subject, html_content, is_active)
VALUES ('booking_payment_reminder', 'Påminnelse: Betalning för bokning',
  '<p>Hej {{user.firstName}}!</p>
   <p>Vi saknar din betalning för din bokning (Booking {{booking.shortId}}).</p>
   <p><a href="{{links.bookingPaymentUrl}}" style="background:#dc2626;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">Öppna betalningssida</a></p>
   <p>Tack!</p>', true)
ON CONFLICT (trigger_type)
DO NOTHING;

INSERT INTO email_templates (trigger_type, subject, html_content, is_active)
VALUES ('package_payment_reminder', 'Påminnelse: Betalning för paket',
  '<p>Hej {{user.firstName}}!</p>
   <p>Vi saknar din betalning för ditt paketköp.</p>
   <p><a href="{{links.packagesPaymentUrl}}" style="background:#dc2626;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">Öppna betalningssida</a></p>
   <p>Tack!</p>', true)
ON CONFLICT (trigger_type)
DO NOTHING;

-- Ensure default receivers (student) for the reminder templates
WITH upsert_template AS (
  SELECT id, trigger_type FROM email_templates WHERE trigger_type IN ('handledar_payment_reminder','booking_payment_reminder','package_payment_reminder')
)
INSERT INTO email_receivers (template_id, receiver_type)
SELECT t.id, 'student'::email_receiver_type FROM upsert_template t
WHERE NOT EXISTS (
  SELECT 1 FROM email_receivers r WHERE r.template_id = t.id AND r.receiver_type = 'student'
);


