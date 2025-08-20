import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const results = [];

    // Insert sample users
    try {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Insert test users
      await db.execute(sql`
        INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
        VALUES 
          ('student@test.se', ${hashedPassword}, 'Test', 'Student', '+46701234567', 'student', true),
          ('teacher@test.se', ${hashedPassword}, 'Test', 'Teacher', '+46701234568', 'teacher', true),
          ('student2@test.se', ${hashedPassword}, 'Anna', 'Andersson', '+46701234569', 'student', true),
          ('student3@test.se', ${hashedPassword}, 'Erik', 'Eriksson', '+46701234570', 'student', true)
        ON CONFLICT (email) DO NOTHING
      `);
      results.push('Inserted test users');
    } catch (e) {
      results.push(`Error inserting users: ${e}`);
    }

    // Insert sample cars
    try {
      await db.execute(sql`
        INSERT INTO cars (name, brand, model, year, color, transmission, license_plate, is_active)
        VALUES 
          ('BMW 1', 'BMW', '118i', 2020, 'Vit', 'manual', 'ABC123', true),
          ('BMW 2', 'BMW', '120i', 2021, 'Svart', 'automatic', 'DEF456', true),
          ('Volvo 1', 'Volvo', 'V40', 2019, 'Blå', 'manual', 'GHI789', true),
          ('Audi 1', 'Audi', 'A3', 2022, 'Grå', 'automatic', 'JKL012', true)
        ON CONFLICT (license_plate) DO NOTHING
      `);
      results.push('Inserted test cars');
    } catch (e) {
      results.push(`Error inserting cars: ${e}`);
    }

    // Insert sample slot settings (if not exists)
    try {
      await db.execute(sql`
        INSERT INTO slot_settings (day_of_week, time_start, time_end, is_active, admin_minutes)
        VALUES 
          (1, '08:00', '17:00', true, 10),
          (2, '08:00', '17:00', true, 10),
          (3, '08:00', '17:00', true, 10),
          (4, '08:00', '17:00', true, 10),
          (5, '08:00', '17:00', true, 10)
        ON CONFLICT DO NOTHING
      `);
      results.push('Inserted slot settings');
    } catch (e) {
      results.push(`Error inserting slot settings: ${e}`);
    }

    // Insert sample bookings
    try {
      // First get lesson type IDs and user IDs
      const lessonTypesRes = await db.execute(sql`SELECT id FROM lesson_types WHERE is_active = true LIMIT 1`);
      const usersRes = await db.execute(sql`SELECT id FROM users WHERE role = 'student' LIMIT 2`);
      const carsRes = await db.execute(sql`SELECT id FROM cars WHERE is_active = true LIMIT 1`);
      const teachersRes = await db.execute(sql`SELECT id FROM users WHERE role = 'teacher' LIMIT 1`);

      const lessonTypes = (lessonTypesRes as any).rows ?? (lessonTypesRes as any);
      const users = (usersRes as any).rows ?? (usersRes as any);
      const cars = (carsRes as any).rows ?? (carsRes as any);
      const teachers = (teachersRes as any).rows ?? (teachersRes as any);

      if (lessonTypes.length > 0 && users.length > 0) {
        const lessonTypeId = lessonTypes[0].id;
        const carId = cars.length > 0 ? cars[0].id : null;
        const teacherId = teachers.length > 0 ? teachers[0].id : null;

        await db.execute(sql`
          INSERT INTO bookings (
            user_id, lesson_type_id, scheduled_date, start_time, end_time, 
            duration_minutes, transmission_type, teacher_id, car_id, 
            status, payment_status, total_price, notes
          )
          VALUES 
            (${users[0].id}, ${lessonTypeId}, '2025-08-01', '09:00', '09:45', 45, 'manual', ${teacherId}, ${carId}, 'confirmed', 'paid', 750, 'Test booking 1'),
            (${users[0].id}, ${lessonTypeId}, '2025-08-03', '10:00', '10:45', 45, 'manual', ${teacherId}, ${carId}, 'pending', 'unpaid', 750, 'Test booking 2')
        `);
        
        if (users.length > 1) {
          await db.execute(sql`
            INSERT INTO bookings (
              user_id, lesson_type_id, scheduled_date, start_time, end_time, 
              duration_minutes, transmission_type, teacher_id, car_id, 
              status, payment_status, total_price, notes
            )
            VALUES 
              (${users[1].id}, ${lessonTypeId}, '2025-08-02', '14:00', '14:45', 45, 'automatic', ${teacherId}, ${carId}, 'confirmed', 'paid', 750, 'Test booking for second user')
          `);
        }
        
        results.push('Inserted test bookings');
      } else {
        results.push('Skipped bookings - no lesson types or users found');
      }
    } catch (e) {
      results.push(`Error inserting bookings: ${e}`);
    }

    // Insert some guest bookings
    try {
      const lessonTypesRes2 = await db.execute(sql`SELECT id FROM lesson_types WHERE is_active = true LIMIT 1`);
      const carsRes2 = await db.execute(sql`SELECT id FROM cars WHERE is_active = true LIMIT 1`);
      const lessonTypes2 = (lessonTypesRes2 as any).rows ?? (lessonTypesRes2 as any);
      const cars2 = (carsRes2 as any).rows ?? (carsRes2 as any);
      
      if (lessonTypes2.length > 0) {
        const lessonTypeId = lessonTypes2[0].id;
        const carId = cars2.length > 0 ? cars2[0].id : null;

        await db.execute(sql`
          INSERT INTO bookings (
            lesson_type_id, scheduled_date, start_time, end_time, 
            duration_minutes, transmission_type, car_id, 
            status, payment_status, total_price, notes,
            is_guest_booking, guest_name, guest_email, guest_phone
          )
          VALUES 
            (${lessonTypeId}, '2025-08-05', '11:00', '11:45', 45, 'manual', ${carId}, 'pending', 'unpaid', 750, 'Guest booking test', true, 'Johan Gäst', 'guest@example.com', '+46701111111')
        `);
        
        results.push('Inserted guest bookings');
      }
    } catch (e) {
      results.push(`Error inserting guest bookings: ${e}`);
    }

    // Insert sample user credits
    try {
      const lessonTypesRes3 = await db.execute(sql`SELECT id FROM lesson_types WHERE is_active = true LIMIT 1`);
      const studentsRes = await db.execute(sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`);
      const lessonTypes3 = (lessonTypesRes3 as any).rows ?? (lessonTypesRes3 as any);
      const students = (studentsRes as any).rows ?? (studentsRes as any);
      
      if (lessonTypes3.length > 0 && students.length > 0) {
        await db.execute(sql`
          INSERT INTO user_credits (user_id, lesson_type_id, credits_remaining, credits_total)
          VALUES (${students[0].id}, ${lessonTypes3[0].id}, 5, 10)
          ON CONFLICT DO NOTHING
        `);
        results.push('Inserted user credits');
      }
    } catch (e) {
      results.push(`Error inserting user credits: ${e}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test data injection completed',
      results 
    });
  } catch (error) {
    console.error('Test data injection error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Test data injection failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
