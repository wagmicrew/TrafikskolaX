# Database (Neon + Drizzle)

- Driver: @neondatabase/serverless; ORM: drizzle-orm
- Client: lib/db/index.ts (throws if DATABASE_URL missing)

Core tables (essentials)
- users: id, email, password (hash), role, firstName, lastName, phone, address, customerNumber, inskriven, customPrice, createdAt
- bookings: id, userId, teacherId, lessonTypeId, date, startTime, endTime, status, paymentStatus, totalPrice, swishUUID, qliroPaymentReference, createdAt
- lesson_types: id, name, description, durationMinutes, price, priceStudent, salePrice, isActive
- user_credits: id, userId, lessonTypeId, creditsRemaining, creditsTotal, packageId, creditType
- site_settings: id, key, value, description, category, isEnv, createdAt

Relationships
- users 1—* bookings (student, teacher)
- bookings *—1 lesson_types
- packages link to purchases and user_credits

Migrations
- drizzle.config.ts uses schema lib/db/schema.ts; replaces -pooler for migrations

Best practices
- Use transactions for multi-step ops
- Index frequently queried columns (userId, scheduledDate)
- Cache site_settings for frequent reads
