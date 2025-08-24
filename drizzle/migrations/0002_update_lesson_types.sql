-- Migration to update lesson types and add teorilektion support

-- Update existing lesson types to use teorilektion category
UPDATE lesson_types 
SET name = CASE 
  WHEN name = 'Handledarkurs' THEN 'Handledarutbildning'
  WHEN name = 'Teorilektion' THEN 'Riskettan'
  ELSE name
END
WHERE name IN ('Handledarkurs', 'Teorilektion');

-- Add new teorilektion type if it doesn't exist
INSERT INTO lesson_types (name, description, duration_minutes, price, price_student, is_active)
VALUES ('Teorilektion', 'Generisk teorilektion', 90, 200, 180, true)
ON CONFLICT (name) DO NOTHING;

-- Add session_type column to handledar_sessions if it doesn't exist
ALTER TABLE handledar_sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(50) DEFAULT 'handledarutbildning';

-- Update existing handledar sessions to have the correct type
UPDATE handledar_sessions 
SET session_type = 'handledarutbildning' 
WHERE session_type IS NULL OR session_type = '';

-- Add supervisor_details table for multiple supervisors per booking
CREATE TABLE IF NOT EXISTS supervisor_details (
  id UUID DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid PRIMARY KEY,
  handledar_booking_id UUID NOT NULL REFERENCES handledar_bookings(id) ON DELETE CASCADE,
  supervisor_name VARCHAR(255) NOT NULL,
  supervisor_email VARCHAR(255),
  supervisor_phone VARCHAR(50),
  supervisor_personal_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_supervisor_details_booking_id ON supervisor_details(handledar_booking_id);
CREATE INDEX IF NOT EXISTS idx_handledar_sessions_type ON handledar_sessions(session_type);

-- Update handledar_bookings to support multiple supervisors
ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) DEFAULT 500.00;
ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS supervisor_count INTEGER DEFAULT 1;
ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS price_per_supervisor DECIMAL(10,2) DEFAULT 500.00;

-- Update existing bookings to have default values
UPDATE handledar_bookings 
SET base_price = 500.00, supervisor_count = 1, price_per_supervisor = 500.00
WHERE base_price IS NULL OR supervisor_count IS NULL OR price_per_supervisor IS NULL;
