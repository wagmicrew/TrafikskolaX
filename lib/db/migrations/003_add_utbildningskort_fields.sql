-- Add Utbildningskort fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS workplace VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kk_validity_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_education_1 DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_education_2 DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS knowledge_test DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS driving_test DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_users_inskriven ON users(inskriven);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
