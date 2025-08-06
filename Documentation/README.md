# TrafikskolaX Documentation

## Overview
This is a comprehensive driving school management system built with Next.js 14, Neon PostgreSQL, and Drizzle ORM. The system handles user management, booking system, payment processing, and automated email communications.

## Quick Start for AI Development

### Technology Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, JWT authentication
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Email**: SendGrid + SMTP fallback
- **Payments**: Swish + Qliro integration

### Key Features
- Multi-role user system (students, teachers, admins)
- Real-time booking system
- Automated email notifications
- Payment processing (Swish, Qliro)
- Admin dashboard with comprehensive management tools

## Documentation Index

### 1. [Database Structure](./DATABASE_STRUCTURE.md)
Complete database schema documentation with:
- All table structures and relationships
- Column descriptions and usage
- Common query patterns
- Security considerations
- Migration strategy

### 2. [API Endpoints](./API_ENDPOINTS.md)
Comprehensive API documentation including:
- Authentication endpoints
- Booking system endpoints
- Admin management endpoints
- Payment processing endpoints
- Email system endpoints
- Error handling patterns

### 3. [Email System](./EMAIL_SYSTEM_AI.md)
Detailed email system documentation covering:
- Template variable system
- Email triggers and contexts
- Configuration management
- Delivery methods (SendGrid, SMTP, fallback)
- Testing procedures
- Best practices

### 4. [Development Guidelines](./DEVELOPMENT_GUIDELINES.md)
Development standards and patterns:
- Code organization
- Database operations
- API development
- Authentication patterns
- Security guidelines
- Performance optimization

## Core Concepts

### Database-First Approach
All data operations use **Neon PostgreSQL** with **Drizzle ORM**:
```typescript
// Example: Fetch schoolname from database
const schoolnameSetting = await db
  .select()
  .from(siteSettings)
  .where(eq(siteSettings.key, 'schoolname'))
  .limit(1);
```

### Authentication System
JWT-based authentication with role-based access:
```typescript
// Server-side authentication
const user = await requireAuthAPI('admin');
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Email Template System
Dynamic email templates with database-driven configuration:
```typescript
// Template variables
const template = `
  Hej {{user.firstName}},
  Din bokning för {{booking.lessonTypeName}} är bekräftad.
  Med vänliga hälsningar, {{schoolName}}
`;
```

## Common Development Tasks

### 1. Adding New Database Tables
```typescript
// 1. Define schema in lib/db/schema.ts
export const newTable = pgTable('new_table', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Create migration
npm run db:generate

// 3. Apply migration
npm run db:migrate
```

### 2. Creating New API Endpoints
```typescript
// app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Business logic here
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3. Adding Email Templates
```typescript
// 1. Add trigger type
type EmailTriggerType = 
  | 'existing_triggers'
  | 'new_trigger';

// 2. Create template in database
await db.insert(emailTemplates).values({
  triggerType: 'new_trigger',
  subject: 'New Email Subject',
  htmlContent: '<h1>Email content with {{variables}}</h1>',
  isActive: true,
});

// 3. Add receivers
await db.insert(emailReceivers).values({
  templateId: template.id,
  receiverType: 'student',
});
```

### 4. Updating Site Settings
```typescript
// Add new setting to database
await db.insert(siteSettings).values({
  key: 'new_setting',
  value: 'default_value',
  description: 'Description of the setting',
  category: 'general',
  isEnv: false,
});

// Update settings API
const categoryMapping = {
  // ... existing mappings
  new_setting: 'general',
};
```

## Security Guidelines

### 1. Always Validate Input
```typescript
// Use Zod for validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
const validatedData = schema.parse(requestBody);
```

### 2. Check User Permissions
```typescript
// Always verify user can access resource
if (user.role !== 'admin' && resource.userId !== user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 3. Use Database Transactions
```typescript
// For related operations
await db.transaction(async (tx) => {
  await tx.insert(table1).values(data1);
  await tx.update(table2).set(data2);
});
```

## Performance Guidelines

### 1. Optimize Database Queries
```typescript
// Use proper indexing and limits
const results = await db
  .select()
  .from(table)
  .where(eq(table.userId, userId))
  .limit(10)
  .orderBy(table.createdAt);
```

### 2. Cache Frequently Accessed Data
```typescript
// Cache site settings
const settings = await getCachedSettings();
```

### 3. Use Efficient Joins
```typescript
// Fetch related data in one query
const bookingsWithDetails = await db
  .select({
    id: bookings.id,
    lessonName: lessonTypes.name,
    teacherName: users.firstName,
  })
  .from(bookings)
  .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
  .leftJoin(users, eq(bookings.teacherId, users.id));
```

## Testing Guidelines

### 1. Test Database Operations
```typescript
describe('User operations', () => {
  it('should create user successfully', async () => {
    const user = await createUser(userData);
    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
});
```

### 2. Test API Endpoints
```typescript
describe('POST /api/users', () => {
  it('should create user with valid data', async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validUserData),
    });
    expect(response.status).toBe(200);
  });
});
```

## Deployment

### Environment Variables
```bash
# Required for production
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
SMTP_PASSWORD=your-smtp-password
SENDGRID_API_KEY=your-sendgrid-key
```

### Build Commands
```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Support

For AI development assistance:
1. Check the specific documentation files for detailed information
2. Follow the established patterns and guidelines
3. Use the database schema as the source of truth
4. Test all changes thoroughly before deployment
5. Maintain consistency with existing code patterns

This documentation provides everything needed to understand, develop, and maintain the TrafikskolaX application effectively. 