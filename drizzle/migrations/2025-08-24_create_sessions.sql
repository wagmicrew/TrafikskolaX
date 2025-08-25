-- Create session_types and sessions tables to match Drizzle schema
 
-- Removed uuid_generate_v4() fallback; using pure SQL default expressions for UUIDs to avoid extensions
--> statement-breakpoint

-- Create enum types
CREATE TYPE IF NOT EXISTS session_type AS ENUM ('handledarutbildning', 'riskettan', 'teorilektion', 'handledarkurs');
--> statement-breakpoint

CREATE TYPE IF NOT EXISTS credit_type AS ENUM ('handledarutbildning', 'riskettan', 'teorilektion', 'handledarkurs');
--> statement-breakpoint

-- Create session_types table
CREATE TABLE IF NOT EXISTS session_types (
  id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type session_type NOT NULL,
  credit_type credit_type NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  price_per_supervisor DECIMAL(10, 2),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_participants INTEGER NOT NULL DEFAULT 1,
  allows_supervisors BOOLEAN DEFAULT FALSE,
  requires_personal_id BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
--> statement-breakpoint

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid,
  session_type_id UUID NOT NULL REFERENCES session_types(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 1,
  current_participants INTEGER NOT NULL DEFAULT 0,
  teacher_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
--> statement-breakpoint

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_session_types_is_active ON session_types(is_active);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_session_types_sort_order ON session_types(sort_order);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_sessions_session_type_id ON sessions(session_type_id);
--> statement-breakpoint

-- Optional: updated_at triggers
CREATE OR REPLACE FUNCTION update_session_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS update_session_types_updated_at ON session_types;
CREATE TRIGGER update_session_types_updated_at
  BEFORE UPDATE ON session_types
  FOR EACH ROW
  EXECUTE FUNCTION update_session_types_updated_at();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_sessions_updated_at();
