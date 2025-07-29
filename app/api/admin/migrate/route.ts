import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAuth('admin');

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

    // Add unique constraint to lesson_types name column if not exists
    try {
      await db.execute(sql`
        ALTER TABLE lesson_types 
        ADD CONSTRAINT lesson_types_name_key UNIQUE (name)
      `);
      results.push('Added unique constraint to lesson_types.name');
    } catch (e) {
      // Constraint might already exist, that's okay
      results.push(`Unique constraint on lesson_types.name: ${e.message?.includes('already exists') ? 'Already exists' : e}`);
    }

    // Update lesson types
    try {
      // First deactivate old lesson types
      await db.execute(sql`
        UPDATE lesson_types 
        SET is_active = false 
        WHERE name NOT IN ('B-körkort', 'Taxiförarlegitimation', 'Handledarutbildning', 'Introduktion')
      `);
      
    // Insert default settings for Qliro and Swish
      const defaultSettings = [
        { key: 'qliro_api_key', value: '', description: 'Qliro API Key for payments', category: 'payment' },
        { key: 'qliro_secret', value: '', description: 'Qliro Secret for payments', category: 'payment' },
        { key: 'qliro_merchant_id', value: '', description: 'Qliro Merchant ID', category: 'payment' },
        { key: 'qliro_sandbox', value: 'true', description: 'Use Qliro sandbox environment', category: 'payment' },
        { key: 'swish_payee_number', value: '', description: 'Swish payee number', category: 'payment' },
        { key: 'swish_callback_url', value: '', description: 'Swish callback URL', category: 'payment' }
      ];

      for (const setting of defaultSettings) {
        try {
          await db.execute(sql`
            INSERT INTO site_settings (key, value, description, category)
            VALUES (${setting.key}, ${setting.value}, ${setting.description}, ${setting.category})
            ON CONFLICT (key) DO NOTHING
          `);
        } catch (settingError) {
          results.push(`Error inserting setting ${setting.key}: ${settingError}`);
        }
      }
      results.push('Inserted default payment settings');

      // Insert lesson types individually to handle conflicts better
      const lessonTypesToInsert = [
        { name: 'B-körkort', description: 'Körlektion för B-körkort', duration: 45, price: 750, studentPrice: 650 },
        { name: 'Taxiförarlegitimation', description: 'Utbildning för taxiförarlegitimation', duration: 60, price: 850, studentPrice: 750 },
        { name: 'Handledarutbildning', description: 'Utbildning för handledare', duration: 120, price: 1500, studentPrice: 1300 },
        { name: 'Introduktion', description: 'Introduktionslektion', duration: 60, price: 650, studentPrice: 550 }
      ];

      for (const lessonType of lessonTypesToInsert) {
        try {
          await db.execute(sql`
            INSERT INTO lesson_types (name, description, duration_minutes, price, price_student, is_active)
            VALUES (${lessonType.name}, ${lessonType.description}, ${lessonType.duration}, ${lessonType.price}, ${lessonType.studentPrice}, true)
            ON CONFLICT (name) DO UPDATE SET
              description = EXCLUDED.description,
              duration_minutes = EXCLUDED.duration_minutes,
              price = EXCLUDED.price,
              price_student = EXCLUDED.price_student,
              is_active = true
          `);
        } catch (insertError) {
          results.push(`Error inserting ${lessonType.name}: ${insertError}`);
        }
      }
      
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
