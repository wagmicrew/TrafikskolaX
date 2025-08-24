-- Migration: Add session type support and unify Teori/Handledar booking flow
-- This allows Handledar sessions to be treated as a special type of Teori session

--> statement-breakpoint

-- Add session_type enum to teori_sessions to support both 'teori' and 'handledar' types
DO $$ BEGIN
  CREATE TYPE session_type_enum AS ENUM ('teori', 'handledar');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint

-- Add session_type column to teori_sessions
ALTER TABLE teori_sessions 
  ADD COLUMN IF NOT EXISTS session_type session_type_enum DEFAULT 'teori';

--> statement-breakpoint

-- Add price column to teori_sessions (allows per-session pricing)
ALTER TABLE teori_sessions 
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

--> statement-breakpoint

-- Update existing teori_sessions to have price from their lesson type
UPDATE teori_sessions 
SET price = tlt.price 
FROM teori_lesson_types tlt 
WHERE teori_sessions.lesson_type_id = tlt.id 
AND teori_sessions.price IS NULL;

--> statement-breakpoint

-- Add reference_id column to link to original handledar_sessions if needed
ALTER TABLE teori_sessions 
  ADD COLUMN IF NOT EXISTS reference_id UUID;

--> statement-breakpoint

-- Add handledar-specific fields to teori_bookings for unified handling
ALTER TABLE teori_bookings 
  ADD COLUMN IF NOT EXISTS participant_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS participant_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS participant_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS participant_personal_number VARCHAR(20);

--> statement-breakpoint

-- Create index on session_type for performance
CREATE INDEX IF NOT EXISTS idx_teori_sessions_session_type ON teori_sessions(session_type);

--> statement-breakpoint

-- Create index on reference_id for linking
CREATE INDEX IF NOT EXISTS idx_teori_sessions_reference_id ON teori_sessions(reference_id);

--> statement-breakpoint

-- Insert seed data for testing
INSERT INTO teori_lesson_types (
  name, 
  description, 
  allows_supervisors, 
  price, 
  price_per_supervisor, 
  duration_minutes, 
  max_participants,
  sort_order
) VALUES 
  ('Grundkurs Teori', 'Grundläggande teorilektion för nya studenter', false, 500.00, null, 60, 1, 1),
  ('Risktväan Teori', 'Teorilektion för risktvåan', false, 500.00, null, 60, 1, 2),
  ('Handledar Teori', 'Teorilektion med handledare - tidigare Handledarutbildning', true, 700.00, 500.00, 120, 1, 3)
ON CONFLICT (name) DO NOTHING;

--> statement-breakpoint

-- Insert sample sessions for testing
DO $$ 
DECLARE
  grundkurs_id UUID;
  handledar_id UUID;
BEGIN
  -- Get lesson type IDs
  SELECT id INTO grundkurs_id FROM teori_lesson_types WHERE name = 'Grundkurs Teori' LIMIT 1;
  SELECT id INTO handledar_id FROM teori_lesson_types WHERE name = 'Handledar Teori' LIMIT 1;
  
  -- Insert sample Teori sessions
  IF grundkurs_id IS NOT NULL THEN
    INSERT INTO teori_sessions (
      lesson_type_id,
      title,
      description,
      date,
      start_time,
      end_time,
      max_participants,
      current_participants,
      session_type,
      price
    ) VALUES 
      (grundkurs_id, 'Grundkurs Teori - Måndag', 'Grundläggande teorilektion', '2025-01-27', '09:00', '10:00', 8, 0, 'teori', 500.00),
      (grundkurs_id, 'Grundkurs Teori - Onsdag', 'Grundläggande teorilektion', '2025-01-29', '14:00', '15:00', 8, 0, 'teori', 500.00),
      (grundkurs_id, 'Grundkurs Teori - Fredag', 'Grundläggande teorilektion', '2025-01-31', '10:00', '11:00', 8, 0, 'teori', 500.00)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Insert sample Handledar sessions
  IF handledar_id IS NOT NULL THEN
    INSERT INTO teori_sessions (
      lesson_type_id,
      title,
      description,
      date,
      start_time,
      end_time,
      max_participants,
      current_participants,
      session_type,
      price
    ) VALUES 
      (handledar_id, 'Handledar Teori - Tisdag', 'Teorilektion med handledare', '2025-01-28', '09:00', '11:00', 6, 0, 'handledar', 700.00),
      (handledar_id, 'Handledar Teori - Torsdag', 'Teorilektion med handledare', '2025-01-30', '13:00', '15:00', 6, 0, 'handledar', 700.00)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
