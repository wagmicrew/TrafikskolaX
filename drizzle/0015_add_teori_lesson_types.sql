-- Add Teori Lesson Types System
-- This migration adds support for Teori lesson types with supervisor management

-- Create teori_lesson_types table
-- Using gen_random_uuid() which is available in PostgreSQL 13+ and Neon
CREATE TABLE IF NOT EXISTS teori_lesson_types (
  id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  allows_supervisors BOOLEAN DEFAULT FALSE,
  price DECIMAL(10, 2) NOT NULL,
  price_per_supervisor DECIMAL(10, 2),
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teori_sessions table
CREATE TABLE IF NOT EXISTS teori_sessions (
  id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid,
  lesson_type_id UUID NOT NULL REFERENCES teori_lesson_types(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 0,
  teacher_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teori_bookings table
CREATE TABLE IF NOT EXISTS teori_bookings (
  id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid,
  session_id UUID NOT NULL REFERENCES teori_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  swish_uuid VARCHAR(255),
  booked_by UUID REFERENCES users(id),
  reminder_sent BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teori_supervisors table
CREATE TABLE IF NOT EXISTS teori_supervisors (
  id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid,
  teori_booking_id UUID NOT NULL REFERENCES teori_bookings(id) ON DELETE CASCADE,
  supervisor_name VARCHAR(255) NOT NULL,
  supervisor_email VARCHAR(255),
  supervisor_phone VARCHAR(50),
  supervisor_personal_number VARCHAR(20),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teori_lesson_types_is_active ON teori_lesson_types(is_active);
CREATE INDEX IF NOT EXISTS idx_teori_lesson_types_sort_order ON teori_lesson_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_teori_sessions_lesson_type_id ON teori_sessions(lesson_type_id);
CREATE INDEX IF NOT EXISTS idx_teori_sessions_date ON teori_sessions(date);
CREATE INDEX IF NOT EXISTS idx_teori_sessions_teacher_id ON teori_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teori_bookings_session_id ON teori_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_teori_bookings_student_id ON teori_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_teori_bookings_status ON teori_bookings(status);
CREATE INDEX IF NOT EXISTS idx_teori_supervisors_booking_id ON teori_supervisors(teori_booking_id);

-- Add some default Teori lesson types
INSERT INTO teori_lesson_types (name, description, allows_supervisors, price, price_per_supervisor, duration_minutes, max_participants, is_active, sort_order) VALUES
('Risktväan Teori', 'Teorilektion för risktvåan - endast studenter', FALSE, 500.00, NULL, 60, 1, TRUE, 1),
('Grundkurs Teori', 'Grundläggande teorilektion för studenter', FALSE, 500.00, NULL, 60, 1, TRUE, 2),
('Avancerad Teori', 'Avancerad teorilektion med möjlighet för handledare', TRUE, 600.00, 400.00, 90, 1, TRUE, 3),
('Handledar Teori', 'Teorilektion med obligatorisk handledare/supervisor', TRUE, 700.00, 500.00, 90, 1, TRUE, 4)
ON CONFLICT DO NOTHING;

-- Add updated_at trigger for teori_lesson_types
CREATE OR REPLACE FUNCTION update_teori_lesson_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_teori_lesson_types_updated_at ON teori_lesson_types;
CREATE TRIGGER update_teori_lesson_types_updated_at
  BEFORE UPDATE ON teori_lesson_types
  FOR EACH ROW
  EXECUTE FUNCTION update_teori_lesson_types_updated_at();

-- Add updated_at trigger for teori_sessions
CREATE OR REPLACE FUNCTION update_teori_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_teori_sessions_updated_at ON teori_sessions;
CREATE TRIGGER update_teori_sessions_updated_at
  BEFORE UPDATE ON teori_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_teori_sessions_updated_at();

-- Add updated_at trigger for teori_bookings
CREATE OR REPLACE FUNCTION update_teori_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_teori_bookings_updated_at ON teori_bookings;
CREATE TRIGGER update_teori_bookings_updated_at
  BEFORE UPDATE ON teori_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_teori_bookings_updated_at();
