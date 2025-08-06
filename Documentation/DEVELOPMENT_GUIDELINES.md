# Development Guidelines for AI

## Technology Stack

### Core Technologies
- **Framework**: Next.js 14 with App Router
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT with bcrypt
- **Email**: SendGrid + SMTP fallback
- **Payments**: Swish + Qliro

### Development Environment
```bash
# Required Node.js version
Node.js 18+ 

# Package manager
npm

# Database
Neon PostgreSQL (cloud hosted)

# Environment variables
Copy .env.example to .env.local
```

## Code Organization

### Directory Structure
```
app/
├── api/                    # API routes
│   ├── admin/             # Admin endpoints
│   ├── auth/              # Authentication
│   ├── booking/           # Booking system
│   └── payments/          # Payment processing
├── dashboard/             # Dashboard pages
│   ├── admin/            # Admin interface
│   ├── student/          # Student interface
│   └── teacher/          # Teacher interface
└── globals.css           # Global styles

components/
├── ui/                   # Reusable UI components
├── booking/              # Booking components
└── Admin/               # Admin components

lib/
├── db/                  # Database configuration
├── email/               # Email services
├── auth/                # Authentication
├── payment/             # Payment services
└── hooks/               # Custom React hooks
```

## Database Guidelines

### Using Drizzle ORM
```typescript
// ✅ Correct - Import schema and use proper types
import { db } from '@/lib/db';
import { users, bookings, siteSettings } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// Query with proper typing
const user = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);

// Insert with proper typing
await db.insert(bookings).values({
  userId: user.id,
  teacherId: teacherId,
  scheduledDate: new Date(),
  startTime: '10:00',
  endTime: '11:00',
  status: 'pending'
});
```

### Database Operations
```typescript
// ✅ Always use transactions for related operations
await db.transaction(async (tx) => {
  // Create booking
  const [booking] = await tx.insert(bookings).values(bookingData).returning();
  
  // Update user credits
  await tx.update(users)
    .set({ credits: user.credits - 1 })
    .where(eq(users.id, userId));
});

// ✅ Use proper error handling
try {
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result[0];
} catch (error) {
  logger.error('Failed to fetch user', { userId, error });
  throw new Error('User not found');
}
```

## API Development

### Route Structure
```typescript
// ✅ Correct - app/api/booking/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await requireAuthAPI('student');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate input
    const body = await request.json();
    const { lessonTypeId, teacherId, scheduledDate } = body;

    if (!lessonTypeId || !teacherId || !scheduledDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Business logic
    const booking = await createBooking({
      userId: user.id,
      lessonTypeId,
      teacherId,
      scheduledDate
    });

    // 4. Return response
    return NextResponse.json({ 
      success: true, 
      booking 
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create booking' 
    }, { status: 500 });
  }
}
```

### Error Handling
```typescript
// ✅ Consistent error responses
const errorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ 
    success: false, 
    error: message 
  }, { status });
};

// ✅ Success responses
const successResponse = (data: any) => {
  return NextResponse.json({ 
    success: true, 
    data 
  });
};
```

## Authentication Guidelines

### Server-Side Authentication
```typescript
// ✅ Use requireAuthAPI for API routes
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  const user = await requireAuthAPI('admin'); // Specify required role
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Continue with authenticated user
}
```

### Client-Side Authentication
```typescript
// ✅ Use useAuth hook for client components
import { useAuth } from '@/lib/hooks/use-auth';

export default function Dashboard() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome {user.firstName}</div>;
}
```

## Email System Guidelines

### Template Variables
```typescript
// ✅ Always fetch schoolname from database
const schoolnameSetting = await db
  .select()
  .from(siteSettings)
  .where(eq(siteSettings.key, 'schoolname'))
  .limit(1);

const schoolname = schoolnameSetting.length > 0 
  ? schoolnameSetting[0].value 
  : 'Din Trafikskola Hässleholm';

// ✅ Use standard template variables
const template = `
  Hej {{user.firstName}},
  Din bokning för {{booking.lessonTypeName}} är bekräftad.
  Med vänliga hälsningar, {{schoolName}}
`;
```

### Email Service Usage
```typescript
// ✅ Use EnhancedEmailService for all emails
import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';

await EnhancedEmailService.sendTriggeredEmail('new_booking', {
  user: { id: '123', firstName: 'John', email: 'john@example.com' },
  booking: { id: '456', scheduledDate: '2024-01-15' }
});
```

## Component Development

### React Components
```typescript
// ✅ Use TypeScript interfaces
interface BookingCardProps {
  booking: Booking;
  onEdit?: (booking: Booking) => void;
  onDelete?: (bookingId: string) => void;
}

export default function BookingCard({ booking, onEdit, onDelete }: BookingCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold">{booking.lessonTypeName}</h3>
      <p className="text-gray-600">{booking.scheduledDate}</p>
      {/* Component content */}
    </div>
  );
}
```

### Form Handling
```typescript
// ✅ Use proper form validation
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function BookingForm() {
  const [formData, setFormData] = useState({
    lessonTypeId: '',
    teacherId: '',
    scheduledDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      toast.success('Booking created successfully');
    } catch (error) {
      toast.error('Failed to create booking');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Testing Guidelines

### Unit Tests
```typescript
// ✅ Test database operations
describe('Booking creation', () => {
  it('should create booking successfully', async () => {
    const bookingData = {
      userId: 'test-user-id',
      teacherId: 'test-teacher-id',
      scheduledDate: '2024-01-15'
    };

    const booking = await createBooking(bookingData);
    expect(booking).toBeDefined();
    expect(booking.status).toBe('pending');
  });
});
```

### Integration Tests
```typescript
// ✅ Test API endpoints
describe('POST /api/booking/create', () => {
  it('should create booking with valid data', async () => {
    const response = await fetch('/api/booking/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBookingData)
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

## Security Guidelines

### Input Validation
```typescript
// ✅ Always validate user input
import { z } from 'zod';

const bookingSchema = z.object({
  lessonTypeId: z.string().uuid(),
  teacherId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/)
});

const validatedData = bookingSchema.parse(requestBody);
```

### SQL Injection Prevention
```typescript
// ✅ Use Drizzle ORM (prevents SQL injection)
const user = await db
  .select()
  .from(users)
  .where(eq(users.id, userId)); // Safe parameterized query

// ❌ Never use raw SQL with user input
// const user = await db.execute(`SELECT * FROM users WHERE id = '${userId}'`);
```

### Authentication Checks
```typescript
// ✅ Always check user permissions
export async function DELETE(request: NextRequest) {
  const user = await requireAuthAPI('admin');
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user can delete this specific resource
  const bookingId = request.nextUrl.searchParams.get('id');
  const booking = await getBooking(bookingId);
  
  if (!booking || (user.role !== 'admin' && booking.userId !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

## Performance Guidelines

### Database Queries
```typescript
// ✅ Use proper indexing and limit results
const bookings = await db
  .select()
  .from(bookings)
  .where(eq(bookings.userId, userId))
  .orderBy(bookings.scheduledDate)
  .limit(10);

// ✅ Use joins for related data
const bookingsWithDetails = await db
  .select({
    id: bookings.id,
    scheduledDate: bookings.scheduledDate,
    lessonName: lessonTypes.name,
    teacherName: users.firstName
  })
  .from(bookings)
  .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
  .leftJoin(users, eq(bookings.teacherId, users.id));
```

### Caching
```typescript
// ✅ Cache frequently accessed data
const getCachedSettings = async () => {
  const cacheKey = 'site_settings';
  let settings = await redis.get(cacheKey);
  
  if (!settings) {
    settings = await db.select().from(siteSettings);
    await redis.setex(cacheKey, 3600, JSON.stringify(settings)); // 1 hour
  }
  
  return settings;
};
```

## Deployment Guidelines

### Environment Variables
```bash
# ✅ Required environment variables
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
SMTP_PASSWORD=your-smtp-password
SENDGRID_API_KEY=your-sendgrid-key
```

### Build Process
```bash
# ✅ Production build
npm run build
npm start

# ✅ Development
npm run dev
```

## Common Patterns

### 1. CRUD Operations
```typescript
// Create
const [newItem] = await db.insert(table).values(data).returning();

// Read
const items = await db.select().from(table).where(eq(table.id, id));

// Update
const [updatedItem] = await db.update(table)
  .set(data)
  .where(eq(table.id, id))
  .returning();

// Delete
await db.delete(table).where(eq(table.id, id));
```

### 2. Pagination
```typescript
const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
const offset = (page - 1) * limit;

const items = await db
  .select()
  .from(table)
  .limit(limit)
  .offset(offset);

const total = await db.select({ count: sql`count(*)` }).from(table);
```

### 3. Search and Filtering
```typescript
const search = request.nextUrl.searchParams.get('search');
const status = request.nextUrl.searchParams.get('status');

let query = db.select().from(table);

if (search) {
  query = query.where(like(table.name, `%${search}%`));
}

if (status) {
  query = query.where(eq(table.status, status));
}

const results = await query;
```

These guidelines ensure consistent, secure, and maintainable code throughout the application. 