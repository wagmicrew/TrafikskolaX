-- Migration: Add Teori lesson types, sessions, bookings, supervisors and link to qliro_orders
-- This migration mirrors the Drizzle schema defined in lib/db/schema.ts for Teori features

-- UUID default helper (no extension required)
-- Uses md5(random()||clock_timestamp())::uuid as in prior migrations

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS teori_lesson_types (
  id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  allows_supervisors BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2) NOT NULL,
  price_per_supervisor DECIMAL(10,2),
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

--> statement-breakpoint

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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS teori_bookings (
  id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid,
  session_id UUID NOT NULL REFERENCES teori_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  swish_uuid VARCHAR(255),
  booked_by UUID REFERENCES users(id),
  reminder_sent BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS teori_supervisors (
  id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid,
  teori_booking_id UUID NOT NULL REFERENCES teori_bookings(id) ON DELETE CASCADE,
  supervisor_name VARCHAR(255) NOT NULL,
  supervisor_email VARCHAR(255),
  supervisor_phone VARCHAR(50),
  supervisor_personal_number VARCHAR(20),
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

--> statement-breakpoint

-- Link Teori bookings to qliro_orders (nullable, no FK to avoid declaration order issues)
ALTER TABLE qliro_orders
  ADD COLUMN IF NOT EXISTS teori_booking_id UUID;

--> statement-breakpoint

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_teori_sessions_date ON teori_sessions(date);
CREATE INDEX IF NOT EXISTS idx_teori_bookings_session_id ON teori_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_teori_bookings_payment_status ON teori_bookings(payment_status);

--> statement-breakpoint

-- updated_at triggers (optional but helpful)
CREATE OR REPLACE FUNCTION update_teori_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  -- teori_lesson_types
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_teori_lesson_types_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_teori_lesson_types_updated_at
      BEFORE UPDATE ON teori_lesson_types
      FOR EACH ROW EXECUTE FUNCTION update_teori_updated_at();
  END IF;

  -- teori_sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_teori_sessions_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_teori_sessions_updated_at
      BEFORE UPDATE ON teori_sessions
      FOR EACH ROW EXECUTE FUNCTION update_teori_updated_at();
  END IF;

  -- teori_bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_teori_bookings_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_teori_bookings_updated_at
      BEFORE UPDATE ON teori_bookings
      FOR EACH ROW EXECUTE FUNCTION update_teori_updated_at();
  END IF;
END $$;
