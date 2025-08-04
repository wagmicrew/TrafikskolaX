-- Add customer_number column to users table
ALTER TABLE users ADD COLUMN customer_number VARCHAR(20) UNIQUE;

-- Update existing users with customer numbers in DTS format
-- This will generate DTS0001, DTS0002, etc. based on created_at order
UPDATE users 
SET customer_number = 'DTS' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::text, 4, '0')
WHERE customer_number IS NULL AND role = 'student';
