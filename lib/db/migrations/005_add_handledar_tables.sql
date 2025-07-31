-- Migration to add handledar sessions and bookings tables

-- Create handledar_sessions table
CREATE TABLE IF NOT EXISTS "handledar_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(255) NOT NULL,
  "description" text,
  "date" date NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "max_participants" integer DEFAULT 2,
  "current_participants" integer DEFAULT 0,
  "price_per_participant" decimal(10,2) NOT NULL,
  "teacher_id" uuid REFERENCES "users"("id"),
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create handledar_bookings table
CREATE TABLE IF NOT EXISTS "handledar_bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid NOT NULL REFERENCES "handledar_sessions"("id") ON DELETE CASCADE,
  "student_id" uuid REFERENCES "users"("id"),
  "supervisor_name" varchar(255) NOT NULL,
  "supervisor_email" varchar(255),
  "supervisor_phone" varchar(50),
  "price" decimal(10,2) NOT NULL,
  "payment_status" varchar(50) DEFAULT 'pending',
  "payment_method" varchar(50),
  "swish_uuid" varchar(255),
  "status" varchar(50) DEFAULT 'pending',
  "booked_by" uuid REFERENCES "users"("id"),
  "reminder_sent" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_handledar_sessions_date" ON "handledar_sessions"("date");
CREATE INDEX IF NOT EXISTS "idx_handledar_sessions_teacher_id" ON "handledar_sessions"("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_handledar_sessions_active" ON "handledar_sessions"("is_active");
CREATE INDEX IF NOT EXISTS "idx_handledar_bookings_session_id" ON "handledar_bookings"("session_id");
CREATE INDEX IF NOT EXISTS "idx_handledar_bookings_student_id" ON "handledar_bookings"("student_id");
