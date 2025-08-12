-- Upsert admin/teacher payment confirmation request template
-- Ensure enum contains swish_payment_verification already

-- Insert or update template with admin moderation link
-- Upsert swish_payment_verification template without DO block
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
              updated_at = NOW();


