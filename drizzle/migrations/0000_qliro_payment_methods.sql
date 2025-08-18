-- Migration: Add Qliro payment method settings
-- This migration adds checkboxes for different Qliro payment methods

-- Insert Qliro payment method settings (idempotent)
INSERT INTO site_settings (key, value, category, description, created_at, updated_at)
VALUES 
  ('qliro_payment_invoice', 'true', 'payment', 'Enable Qliro Invoice payment method', NOW(), NOW()),
  ('qliro_payment_campaign', 'false', 'payment', 'Enable Qliro Campaign payment method', NOW(), NOW()),
  ('qliro_payment_partpayment_account', 'false', 'payment', 'Enable Qliro Part Payment Account', NOW(), NOW()),
  ('qliro_payment_partpayment_fixed', 'false', 'payment', 'Enable Qliro Part Payment Fixed', NOW(), NOW()),
  ('qliro_payment_creditcards', 'true', 'payment', 'Enable Qliro Credit Cards payment method', NOW(), NOW()),
  ('qliro_payment_free', 'false', 'payment', 'Enable Qliro Free payment method', NOW(), NOW()),
  ('qliro_payment_trustly_direct', 'false', 'payment', 'Enable Qliro Trustly Direct payment method', NOW(), NOW()),
  ('qliro_payment_swish', 'false', 'payment', 'Enable Qliro Swish payment method', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
