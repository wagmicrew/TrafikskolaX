-- Add missing columns for comprehensive admin features

-- Add inskriven column to users table (already exists in previous migration)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS inskriven BOOLEAN DEFAULT false;

-- Add custom price for inskriven students
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS inskriven_date TIMESTAMP;

-- Add site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  category VARCHAR(100), -- 'general', 'email', 'payment', 'booking'
  is_env BOOLEAN DEFAULT false, -- true if it's an env variable
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add handledar (supervisor) training settings
CREATE TABLE IF NOT EXISTS handledar_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_participants INTEGER DEFAULT 2, -- 2 people per session (student + supervisor)
  current_participants INTEGER DEFAULT 0,
  teacher_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add handledar bookings relation
CREATE TABLE IF NOT EXISTS handledar_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES handledar_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id),
  supervisor_name VARCHAR(255),
  supervisor_email VARCHAR(255),
  supervisor_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add custom slot overrides (for special dates)
CREATE TABLE IF NOT EXISTS slot_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  reason TEXT,
  is_available BOOLEAN DEFAULT true, -- false means blocked
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(date, time_start, time_end)
);

-- Add admin time settings to slot_settings
ALTER TABLE slot_settings ADD COLUMN IF NOT EXISTS admin_minutes INTEGER DEFAULT 0;

-- Add car assignment to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES cars(id);

-- Add completed status and feedback ready flag
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS feedback_ready BOOLEAN DEFAULT false;

-- Add invoice tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMP;

-- Add package purchase tracking
CREATE TABLE IF NOT EXISTS package_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  package_id UUID REFERENCES packages(id) NOT NULL,
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  price_paid DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  invoice_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Update lesson types for B-körkort and Taxi only + handledar
UPDATE lesson_types SET is_active = false WHERE name NOT IN ('B-körkort', 'Taxiförarlegitimation', 'Handledarutbildning', 'Introduktion');

-- Insert lesson types if they don't exist
INSERT INTO lesson_types (name, description, duration_minutes, price, price_student, is_active)
VALUES 
  ('B-körkort', 'Körlektion för B-körkort', 45, 750, 650, true),
  ('Taxiförarlegitimation', 'Utbildning för taxiförarlegitimation', 60, 850, 750, true),
  ('Handledarutbildning', 'Utbildning för handledare', 120, 1500, 1300, true),
  ('Introduktion', 'Introduktionslektion', 60, 650, 550, true)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id ON bookings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_slot_overrides_date ON slot_overrides(date);
CREATE INDEX IF NOT EXISTS idx_handledar_sessions_date ON handledar_sessions(date);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_handledar_sessions_updated_at BEFORE UPDATE ON handledar_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slot_overrides_updated_at BEFORE UPDATE ON slot_overrides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
