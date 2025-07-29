import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';
import { verifyAuth } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = [];

    // Add missing columns to users table
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS inskriven BOOLEAN DEFAULT false`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10, 2)`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS inskriven_date TIMESTAMP`);
      results.push('Added missing columns to users table');
    } catch (e) {
      results.push(`Error adding columns to users: ${e}`);
    }

    // Create site_settings table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS site_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key VARCHAR(255) NOT NULL UNIQUE,
          value TEXT,
          description TEXT,
          category VARCHAR(100),
          is_env BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
      results.push('Created site_settings table');
    } catch (e) {
      results.push(`Error creating site_settings table: ${e}`);
    }

    // Create handledar_sessions table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS handledar_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          max_participants INTEGER DEFAULT 2,
          current_participants INTEGER DEFAULT 0,
          teacher_id UUID REFERENCES users(id),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
      results.push('Created handledar_sessions table');
    } catch (e) {
      results.push(`Error creating handledar_sessions table: ${e}`);
    }

    // Create handledar_bookings table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS handledar_bookings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          session_id UUID REFERENCES handledar_sessions(id) ON DELETE CASCADE,
          student_id UUID REFERENCES users(id),
          supervisor_name VARCHAR(255),
          supervisor_email VARCHAR(255),
          supervisor_phone VARCHAR(50),
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
      results.push('Created handledar_bookings table');
    } catch (e) {
      results.push(`Error creating handledar_bookings table: ${e}`);
    }

    // Create slot_overrides table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS slot_overrides (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          date DATE NOT NULL,
          time_start TIME NOT NULL,
          time_end TIME NOT NULL,
          reason TEXT,
          is_available BOOLEAN DEFAULT true,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          UNIQUE(date, time_start, time_end)
        )
      `);
      results.push('Created slot_overrides table');
    } catch (e) {
      results.push(`Error creating slot_overrides table: ${e}`);
    }

    // Add admin_minutes to slot_settings
    try {
      await db.execute(sql`ALTER TABLE slot_settings ADD COLUMN IF NOT EXISTS admin_minutes INTEGER DEFAULT 0`);
      results.push('Added admin_minutes to slot_settings');
    } catch (e) {
      results.push(`Error adding admin_minutes column: ${e}`);
    }

    // Add missing columns to bookings
    try {
      await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES cars(id)`);
      await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false`);
      await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`);
      await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS feedback_ready BOOLEAN DEFAULT false`);
      await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100)`);
      await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMP`);
      results.push('Added missing columns to bookings table');
    } catch (e) {
      results.push(`Error adding columns to bookings: ${e}`);
    }

    // Create package_purchases table
    try {
      await db.execute(sql`
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
        )
      `);
      results.push('Created package_purchases table');
    } catch (e) {
      results.push(`Error creating package_purchases table: ${e}`);
    }

    // Update lesson types
    try {
      await db.execute(sql`
        UPDATE lesson_types 
        SET is_active = false 
        WHERE name NOT IN ('B-körkort', 'Taxiförarlegitimation', 'Handledarutbildning', 'Introduktion')
      `);
      
      await db.execute(sql`
        INSERT INTO lesson_types (name, description, duration_minutes, price, price_student, is_active)
        VALUES 
          ('B-körkort', 'Körlektion för B-körkort', 45, 750, 650, true),
          ('Taxiförarlegitimation', 'Utbildning för taxiförarlegitimation', 60, 850, 750, true),
          ('Handledarutbildning', 'Utbildning för handledare', 120, 1500, 1300, true),
          ('Introduktion', 'Introduktionslektion', 60, 650, 550, true)
        ON CONFLICT (name) DO NOTHING
      `);
      results.push('Updated lesson types');
    } catch (e) {
      results.push(`Error updating lesson types: ${e}`);
    }

    // Create indexes
    try {
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id ON bookings(teacher_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_slot_overrides_date ON slot_overrides(date)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_handledar_sessions_date ON handledar_sessions(date)`);
      results.push('Created indexes');
    } catch (e) {
      results.push(`Error creating indexes: ${e}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migrations completed',
      results 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
