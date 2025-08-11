-- Add Qliro fields to package_purchases if they do not exist
ALTER TABLE package_purchases
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
  ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
