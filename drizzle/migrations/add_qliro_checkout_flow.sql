-- Add qliro_checkout_flow setting to site_settings table
-- Values: 'window' (default) or 'popup'

INSERT INTO site_settings (key, value, description, created_at, updated_at) 
VALUES (
  'qliro_checkout_flow', 
  'window', 
  'Qliro checkout flow type: window (new window) or popup (modal popup)', 
  NOW(), 
  NOW()
) ON CONFLICT (key) DO NOTHING;
