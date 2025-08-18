-- Migration: Add qliro_checkout_flow setting to site_settings table
-- This migration adds the qliro_checkout_flow setting to control whether Qliro uses window or popup flow
-- Values: 'window' (default) or 'popup'

-- Add the setting if it doesn't exist (idempotent)
INSERT INTO site_settings (key, value, description, created_at, updated_at) 
VALUES (
  'qliro_checkout_flow', 
  'window', 
  'Qliro checkout flow type: window (new window) or popup (modal popup)', 
  NOW(), 
  NOW()
) ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW()
WHERE site_settings.key = 'qliro_checkout_flow';

-- Add additional Qliro-related settings for better configuration
INSERT INTO site_settings (key, value, description, created_at, updated_at) 
VALUES 
  ('qliro_debug_logs', 'false', 'Enable extended Qliro debug logging', NOW(), NOW()),
  ('qliro_retry_attempts', '3', 'Number of retry attempts for Qliro API calls', NOW(), NOW()),
  ('qliro_cache_duration', '300', 'Qliro settings cache duration in seconds', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW()
WHERE site_settings.key IN ('qliro_debug_logs', 'qliro_retry_attempts', 'qliro_cache_duration');
