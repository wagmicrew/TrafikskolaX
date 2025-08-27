# TrafikskolaX Booking Flow System Documentation

## 📋 **Overview**

This document provides comprehensive information about the TrafikskolaX booking flow system, including the handledare (supervisor) functionality, session management, and technical implementation details. This system enables students to book driving lessons and theoretical sessions with proper spot management and handledare support.

## 🎯 **Key Features**

### **1. Two-Group Lesson Selection System**
- **Körlektioner**: Practical driving lessons with instructors
- **Teorilektioner**: Theoretical lessons including handledarutbildning (supervisor training)
- **Unified grouping**: All theoretical sessions (teori + handledar) grouped under "Teorilektioner"

### **2. Manual Handledare Entry System**
- **No selection from lists**: Pure manual entry only
- **Clear Swedish labels**: Fullständigt namn, E-postadress, Telefonnummer, Personnummer
- **Dynamic management**: Add/remove handledare with spot availability checking
- **Real-time validation**: Prevents overbooking with immediate feedback

### **3. Intelligent Spot Management**
- **Real-time calculation**: 1 student + N handledare = total spots required
- **Visual feedback**: Shows available spots and current usage
- **Smart UI**: Add button only appears when sufficient spots available
- **Validation**: Prevents booking when insufficient spots

### **4. Paginated Session Management**
- **10 sessions per page**: Performance optimized display
- **Smart sorting**: Available sessions first, then by date
- **Session statistics**: Total, available, and full session counts
- **Navigation controls**: Previous/Next with page counters

### **5. Next Available Session Suggestion**
- **Smart suggestion**: Shows next available session on first page
- **Visual indicator**: Bell icon with session details
- **One-click selection**: Direct booking button
- **Conditional display**: Only shows when sessions are available

## 🗄️ **Database Structure**

### **Core Tables Used**

#### **1. bookings**
Primary booking table containing all booking information.
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES users(id),
  lessonTypeId UUID REFERENCES lesson_types(id),
  scheduledDate DATE NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  durationMinutes INTEGER NOT NULL,
  transmissionType VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  paymentStatus VARCHAR(30) DEFAULT 'pending',
  paymentMethod VARCHAR(20),
  swishUUID VARCHAR(255),
  teacherId UUID REFERENCES users(id),
  isGuestBooking BOOLEAN DEFAULT FALSE,
  guestName VARCHAR(255),
  guestEmail VARCHAR(255),
  guestPhone VARCHAR(255),
  totalPrice DECIMAL(10,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
```

#### **2. lesson_types**
Driving lesson types (körlektioner).
```sql
CREATE TABLE lesson_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  durationMinutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  priceStudent DECIMAL(10,2),
  salePrice DECIMAL(10,2),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **3. teori_lesson_types**
Theoretical lesson types (teorilektioner including handledar).
```sql
CREATE TABLE teori_lesson_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  allows_supervisors BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2) NOT NULL,
  price_per_supervisor DECIMAL(10,2),
  duration_minutes INTEGER NOT NULL,
  max_participants INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **4. teori_sessions**
Individual theoretical sessions with participant tracking.
```sql
CREATE TABLE teori_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_type_id UUID REFERENCES teori_lesson_types(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **5. teori_bookings**
Links users to theoretical sessions.
```sql
CREATE TABLE teori_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES teori_sessions(id),
  user_id UUID REFERENCES users(id),
  booking_id UUID REFERENCES bookings(id),
  is_guest BOOLEAN DEFAULT FALSE,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(255),
  status VARCHAR(20) DEFAULT 'confirmed',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **6. booking_plan_items**
Lesson planning items for admin management.
```sql
CREATE TABLE booking_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  step_identifier VARCHAR(50) NOT NULL,
  added_by UUID REFERENCES users(id),
  is_selected BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **7. booking_steps**
Available lesson planning steps.
```sql
CREATE TABLE booking_steps (
  id SERIAL PRIMARY KEY,
  step_number INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **8. users**
User information including students and admins.
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'student',
  customerNumber VARCHAR(50),
  isActive BOOLEAN DEFAULT TRUE,
  personalNumber VARCHAR(20),
  dateOfBirth DATE,
  address VARCHAR(255),
  postalCode VARCHAR(10),
  city VARCHAR(100),
  licenseNumber VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 **Technical Implementation**

### **Frontend Architecture**

#### **React Components Structure**
```
app/boka-korning/page.tsx
├── LessonSelection Component
├── WeekCalendar Component
├── Session Selection UI
├── Guest Information Form
├── Handledare Information Form
└── Confirmation UI
```

#### **State Management**
```typescript
// Main booking page state
const [currentStep, setCurrentStep] = useState<BookingStep>('lesson-selection')
const [selectedLessonType, setSelectedLessonType] = useState<SessionType | null>(null)
const [bookingData, setBookingData] = useState<BookingData | null>(null)
const [guestInfo, setGuestInfo] = useState({...})
const [handledareInfo, setHandledareInfo] = useState<HandledareInfo[]>([])
const [currentPage, setCurrentPage] = useState(1)
const sessionsPerPage = 10
```

#### **Key Functions**

##### **Spot Availability Management**
```typescript
const checkSpotAvailability = (studentCount: number, handledareCount: number, maxSpots: number): boolean => {
  return (studentCount + handledareCount) <= maxSpots;
}

const getAvailableSpots = (maxParticipants: number, currentParticipants: number): number => {
  return Math.max(0, maxParticipants - currentParticipants);
}
```

##### **Session Pagination**
```typescript
const getPaginatedSessions = (sessions: TeoriSession[], page: number, perPage: number) => {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  return {
    sessions: sessions.slice(startIndex, endIndex),
    totalPages: Math.ceil(sessions.length / perPage),
    hasMore: endIndex < sessions.length
  };
}
```

##### **Handledare Validation**
```typescript
const validateHandledareInfo = (handledare: HandledareInfo[]): boolean => {
  return handledare.every(h =>
    h.name.trim() &&
    h.email.trim() &&
    h.phone.trim() &&
    h.personalNumber.trim()
  );
}
```

### **API Endpoints**

#### **Core Booking Endpoints**
- `GET /api/lesson-types` - Fetch driving lesson types
- `GET /api/teori-sessions` - Fetch theoretical sessions with availability
- `POST /api/booking/create` - Create new booking
- `POST /api/booking/confirm` - Confirm temporary booking
- `DELETE /api/booking/cleanup` - Cleanup temporary bookings

#### **Admin Endpoints**
- `GET /api/admin/bookings/[id]/plan` - Get lesson planning items
- `PUT /api/admin/bookings/[id]/plan` - Update lesson planning
- `GET /api/booking-steps` - Get available planning steps

#### **Payment Endpoints**
- `POST /api/booking/mark-as-paid` - Mark payment as completed
- `POST /api/admin/booking/confirm-payment` - Admin payment confirmation

## 🚀 **User Flow**

### **Step 1: Lesson Selection**
```
┌─────────────────────────────────────┐
│         VÄLJ LEKTIONSTYP            │
├─────────────────────────────────────┤
│                                     │
│  🚗 Körlektioner                   │
│     Praktiska körlektioner         │
│     med instruktör                 │
│                                     │
│  📚 Teorilektioner                 │
│     Teoretiska lektioner och       │
│     handledarutbildning            │
│                                     │
└─────────────────────────────────────┘
```

### **Step 2: Session Selection**
```
┌─────────────────────────────────────┐
│       VÄLJ SESSION                  │
├─────────────────────────────────────┤
│ 📊 Statistik:                       │
│ • Totalt: 25 sessioner             │
│ • Tillgängliga: 18                 │
│ • Fullbokade: 7                    │
│                                     │
│ 🔔 Nästa tillgängliga:             │
│ • 2024-01-15 09:00                 │
│ • 8 platser kvar                   │
│ • [Välj denna session]             │
│                                     │
│ 📄 Tillgängliga sessioner:         │
│ • 2024-01-15 09:00 ✓ 8/10 platser  │
│ • 2024-01-15 10:00 ✓ 6/10 platser  │
│ • 2024-01-15 11:00 ✗ Fullbokad     │
│ ...                                │
│                                     │
│ Sida 1 av 3 [Föregående] [Nästa]   │
└─────────────────────────────────────┘
```

### **Step 3: User Information**
```
┌─────────────────────────────────────┐
│     ANGE DINA UPPGIFTER             │
├─────────────────────────────────────┤
│ Namn: ____________________          │
│ E-post: __________________          │
│ Telefon: _________________          │
│ Personnummer: _____________         │
│                                     │
│ Tillgängliga platser: 8 av 10      │
│ 1 student + 0 handledare = 1 upptagen│
└─────────────────────────────────────┘
```

### **Step 4: Handledare Information (if applicable)**
```
┌─────────────────────────────────────┐
│   ANGE HANDLEDare uppgifter         │
├─────────────────────────────────────┤
│ Tillgängliga platser: 8 av 10      │
│ 1 student + 2 handledare = 3 upptagna│
│                                     │
│ Handledare 1:                      │
│ Fullständigt namn: _______________ │
│ E-postadress: ____________________ │
│ Telefonnummer: ___________________ │
│ Personnummer: ____________________ │
│                                     │
│ Handledare 2:                      │
│ Fullständigt namn: _______________ │
│ E-postadress: ____________________ │
│ Telefonnummer: ___________________ │
│ Personnummer: ____________________ │
│                                     │
│ [+ Lägg till ytterligare handledare]│
│                                     │
│ [Tillbaka] [Fortsätt till bekräftelse]│
└─────────────────────────────────────┘
```

### **Step 5: Confirmation**
```
┌─────────────────────────────────────┐
│       BEKRÄFTA BOKNING              │
├─────────────────────────────────────┤
│ Lektionstyp: Handledarutbildning   │
│ Datum: 2024-01-15                   │
│ Tid: 09:00 - 17:00                 │
│ Pris: 2,500 kr                     │
│                                     │
│ 📋 Deltagare:                      │
│ Student: Anna Andersson             │
│                                     │
│ 👥 Handledare:                     │
│ 1. Lars Larsson                    │
│ 2. Maria Nilsson                   │
│                                     │
│ [Tillbaka] [Bekräfta bokning]      │
└─────────────────────────────────────┘
```

## 🧠 **AI Engine Information**

### **System Purpose**
This booking system manages driving school appointments with special support for handledare (supervisor) training sessions. It handles spot management, participant tracking, and provides a user-friendly interface for both students and administrators.

### **Key Concepts**
- **Handledare**: Supervisors who accompany students during driving lessons
- **Spot Management**: Each person (student + handledare) occupies one spot in a session
- **Session Availability**: Real-time tracking of available spots in each session
- **Pagination**: Sessions displayed in pages of 10 for performance
- **Lesson Planning**: Admin feature to plan lesson content and steps

### **Data Flow**
1. **Lesson Selection**: User chooses between körlektioner or teorilektioner
2. **Session Browsing**: Paginated view with availability indicators
3. **Information Collection**: Personal details + handledare information (if applicable)
4. **Spot Validation**: System ensures sufficient spots for all participants
5. **Booking Creation**: Temporary booking created and confirmed
6. **Payment Processing**: Integration with Swish/Qliro payment systems

### **Business Rules**
- **Handledare Sessions**: Require manual entry of supervisor details
- **Spot Calculation**: 1 student + N handledare = total spots needed
- **Availability Priority**: Available sessions shown first
- **Next Session Suggestion**: Automatic suggestion of next available session
- **Overbooking Prevention**: System prevents booking when insufficient spots

### **Technical Constraints**
- **Manual Entry Only**: Handledare information must be entered manually
- **Swedish Labels**: All UI text in Swedish
- **Spot Validation**: Real-time availability checking
- **Pagination**: Maximum 10 sessions per page
- **Mobile Responsive**: Works on all screen sizes

## 📊 **Performance Considerations**

### **Database Optimization**
- **Indexes**: Primary keys and foreign key relationships indexed
- **Pagination**: LIMIT/OFFSET for efficient session loading
- **Caching**: Session availability cached where possible
- **Cleanup**: Automatic cleanup of temporary bookings

### **Frontend Optimization**
- **Lazy Loading**: Components loaded as needed
- **State Management**: Efficient React state updates
- **Real-time Validation**: Immediate feedback without API calls
- **Responsive Images**: Optimized for different screen sizes

## 🔒 **Security Considerations**

### **Input Validation**
- **XSS Protection**: Sanitized input handling
- **SQL Injection**: Parameterized queries
- **Personal Data**: Secure handling of Swedish personal numbers
- **Authentication**: JWT token validation

### **Access Control**
- **Role-based Access**: Admin vs student permissions
- **Session Management**: Secure session handling
- **API Protection**: Authentication required for sensitive operations

## 🧪 **Testing Scenarios**

### **Handledare Booking Flow**
1. Select "Teorilektioner" → "Handledarutbildning"
2. Browse available sessions (pagination)
3. Enter student information
4. Add handledare (manual entry)
5. Verify spot availability warnings
6. Complete booking
7. Verify handledare data stored correctly

### **Spot Management**
1. Book session with limited spots
2. Try to add too many handledare
3. Verify error messages and UI updates
4. Add maximum allowed handledare
5. Complete booking successfully

### **Session Pagination**
1. Create many sessions (20+)
2. Verify 10 per page display
3. Test pagination controls
4. Verify session sorting (available first)
5. Test next session suggestion

## 📈 **Monitoring & Analytics**

### **Key Metrics**
- **Booking Conversion**: Step completion rates
- **Session Utilization**: Spots used vs available
- **Handledare Participation**: Average handledare per session
- **User Experience**: Time to complete booking

### **Error Tracking**
- **Spot Availability Errors**: Overbooking attempts
- **Session Loading Issues**: Pagination problems
- **Handledare Validation**: Missing required fields

## 🚀 **Deployment & Maintenance**

### **Environment Variables**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### **Build Process**
```bash
npm install
npm run build
npm start
```

### **Database Migrations**
```bash
# Apply pending migrations
npm run db:migrate

# Generate new migration
npm run db:generate
```

This comprehensive system provides a robust, user-friendly booking experience with special attention to handledare management and spot availability. The implementation follows modern React patterns with proper Swedish localization and comprehensive error handling.
