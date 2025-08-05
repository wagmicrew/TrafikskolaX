-- Add Qliro production settings
INSERT INTO site_settings (key, value, category, description, is_env)
VALUES 
  ('qliro_prod_enabled', 'false', 'payment', 'Enable Qliro production environment', false),
  ('qliro_prod_merchant_id', '', 'payment', 'Qliro production merchant ID', false),
  ('qliro_prod_api_key', '', 'payment', 'Qliro production API key', true),
  ('qliro_prod_api_url', 'https://api.qliro.com', 'payment', 'Qliro production API URL', false),
  ('qliro_webhook_secret', '', 'payment', 'Qliro webhook secret for signature verification', true),
  ('qliro_test_passed', 'false', 'payment', 'Whether Qliro test has passed', false),
  ('qliro_last_test_date', '', 'payment', 'Last Qliro test date', false)
ON CONFLICT (key) DO NOTHING;

-- Add payment reference tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qliro_payment_reference VARCHAR(255);
ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS qliro_payment_reference VARCHAR(255);
ALTER TABLE package_purchases ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
