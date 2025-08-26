# 🚨 In-Depth Analysis: Tables Marked for Removal But Cannot Be Deleted

## Overview
This report provides a detailed analysis of the 4 tables that **cannot be safely removed** due to active production references, examining their purpose, functionality, and potential duplication concerns.

---

## 🔴 1. handledar_bookings & handledar_sessions - SUPERVISOR TRAINING SYSTEM

### **Table Structure Analysis**

#### **handledar_sessions** (Supervisor Training Sessions)
```sql
CREATE TABLE handledar_sessions (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  maxParticipants INTEGER DEFAULT 2,
  currentParticipants INTEGER DEFAULT 0,
  pricePerParticipant DECIMAL(10,2) NOT NULL,
  teacherId UUID REFERENCES users(id),
  isActive BOOLEAN DEFAULT TRUE,
  sessionType VARCHAR(50) DEFAULT 'handledarutbildning', -- 'handledarutbildning' or 'riskettan'
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### **handledar_bookings** (Supervisor Training Bookings)
```sql
CREATE TABLE handledar_bookings (
  id UUID PRIMARY KEY,
  sessionId UUID NOT NULL REFERENCES handledar_sessions(id),
  studentId UUID REFERENCES users(id),
  supervisorName VARCHAR(255) NOT NULL,
  supervisorEmail VARCHAR(255),
  supervisorPhone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  price DECIMAL(10,2) NOT NULL,
  basePrice DECIMAL(10,2) DEFAULT '500.00',
  supervisorCount INTEGER DEFAULT 1,
  pricePerSupervisor DECIMAL(10,2) DEFAULT '500.00',
  paymentStatus VARCHAR(50) DEFAULT 'pending',
  paymentMethod VARCHAR(50),
  swishUuid VARCHAR(255),
  bookedBy UUID REFERENCES users(id),
  reminderSent BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### **Active API Usage**
- **Location**: `app/api/admin/handledar-sessions/route.ts`
- **Purpose**: Complete CRUD operations for supervisor training sessions
- **Functionality**:
  - Session creation and management
  - Booking management with payment processing
  - Automatic cleanup of stale bookings
  - Integration with payment systems (Swish)

### **Potential Duplication Analysis**
- **❌ NOT DUPLICATE**: This is a **separate system** for supervisor training
- **Purpose**: Handles specialized "handledarutbildning" and "riskettan" courses
- **Difference from regular bookings**:
  - Multiple supervisors per session
  - Different pricing model (per participant)
  - Specialized course content
  - Separate from regular driving lessons

### **Recommendation**
- **KEEP**: This is an active, separate business feature for supervisor training
- **Suggestion**: Consider renaming to `supervisor_training_sessions` and `supervisor_training_bookings` for clarity

---

## 🟡 2. internal_messages - INTERNAL MESSAGING SYSTEM

### **Table Structure Analysis**
```sql
CREATE TABLE internal_messages (
  id UUID PRIMARY KEY,
  fromUserId UUID NOT NULL REFERENCES users(id),
  toUserId UUID NOT NULL REFERENCES users(id),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  bookingId UUID REFERENCES bookings(id), -- Optional reference to booking
  messageType VARCHAR(50) DEFAULT 'general', -- general, payment_confirmation, booking_related
  createdAt TIMESTAMP DEFAULT NOW(),
  readAt TIMESTAMP
);
```

### **Active API Usage**
- **Location**: `app/api/booking/create/route.ts`
- **Purpose**: Automated internal messaging system
- **Functionality**:
  - Booking confirmations
  - Payment notifications
  - Internal communication between users
  - Message status tracking (read/unread)

### **Potential Duplication Analysis**
- **❌ NOT DUPLICATE**: This is a **unique messaging system**
- **Purpose**: Internal user-to-user communication within the platform
- **Difference from external email**:
  - Internal platform messaging
  - Linked to specific bookings
  - Read status tracking
  - Different from email templates system

### **Recommendation**
- **KEEP**: Essential for internal communication
- **Suggestion**: Consider if this could be replaced by a more modern messaging system, but currently active and needed

---

## 🟠 3. lesson_types - LESSON TYPE MANAGEMENT

### **Table Structure Analysis**
```sql
CREATE TABLE lesson_types (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  durationMinutes INTEGER NOT NULL DEFAULT 45,
  price DECIMAL(10,2) NOT NULL,
  priceStudent DECIMAL(10,2),
  salePrice DECIMAL(10,2),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### **Active API Usage**
- **Location**: `app/api/teori-sessions/route.ts`, `app/api/booking/available-slots/route.ts`
- **Purpose**: Core lesson type definitions for the entire booking system
- **Functionality**:
  - Defines available lesson types (B-license, theory, etc.)
  - Pricing and duration management
  - Referenced by regular bookings table

### **Potential Duplication Analysis**
- **⚠️ POSSIBLE DUPLICATION CONCERN**: There is a `teori_lesson_types` table

#### **teori_lesson_types** Structure:
```sql
CREATE TABLE teori_lesson_types (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  allowsSupervisors BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2) NOT NULL,
  pricePerSupervisor DECIMAL(10,2),
  durationMinutes INTEGER DEFAULT 60,
  maxParticipants INTEGER DEFAULT 1,
  isActive BOOLEAN DEFAULT TRUE,
  sortOrder INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### **Duplication Analysis**
- **🔍 PARTIAL DUPLICATION**: Both tables serve similar purposes but for different systems:
  - `lesson_types`: Used by regular driving lesson bookings
  - `teori_lesson_types`: Used by theory sessions and handledar sessions
- **Key Differences**:
  - `teori_lesson_types` has supervisor support and participant limits
  - `teori_lesson_types` has sort ordering
  - Different duration defaults (45min vs 60min)

### **Recommendation**
- **⚠️ INVESTIGATE FURTHER**: This might be a candidate for consolidation
- **Suggestion**: Consider unifying into a single `lesson_types` table with a `category` field to distinguish between regular lessons and theory/supervisor training

---

## 📊 Summary & Recommendations

### **Tables to Keep (Active & Essential)**

#### **1. handledar_bookings & handledar_sessions**
- **Status**: ✅ KEEP - Active business feature
- **Reason**: Separate supervisor training system
- **Action**: Consider renaming for clarity

#### **2. internal_messages**
- **Status**: ✅ KEEP - Active communication feature
- **Reason**: Essential internal messaging system
- **Action**: Monitor usage and consider modernization

#### **3. lesson_types**
- **Status**: ⚠️ REVIEW - Possible consolidation candidate
- **Reason**: Core to booking system, but duplicated functionality exists
- **Action**: Investigate consolidation with `teori_lesson_types`

### **Migration Strategy Suggestions**

#### **High Priority - Investigate lesson_types Consolidation**
1. **Analyze Usage Patterns**:
   ```sql
   SELECT COUNT(*) FROM bookings WHERE lesson_type_id IS NOT NULL;
   SELECT COUNT(*) FROM teori_sessions WHERE lesson_type_id IS NOT NULL;
   ```

2. **Consider Unified Structure**:
   ```sql
   CREATE TABLE unified_lesson_types (
     id UUID PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     category VARCHAR(50) NOT NULL, -- 'driving', 'theory', 'supervisor'
     -- ... existing fields
   );
   ```

#### **Medium Priority - handledar Tables**
1. **Rename for Clarity**:
   ```sql
   ALTER TABLE handledar_sessions RENAME TO supervisor_training_sessions;
   ALTER TABLE handledar_bookings RENAME TO supervisor_training_bookings;
   ```

2. **Update API References**: Update all code references

#### **Low Priority - internal_messages**
1. **Monitor Usage**: Track if users actually use the messaging system
2. **Consider External Integration**: Could be replaced by external messaging services

---

## 🔍 Conclusion

**3 out of 4 tables should be kept** as they represent active, distinct business functionality:

- `handledar_*` tables: Separate supervisor training system ✅
- `internal_messages`: Internal communication system ✅  
- `lesson_types`: Core to booking system but needs consolidation review ⚠️

**Only `lesson_types` warrants further investigation** for potential consolidation with `teori_lesson_types` to reduce duplication while maintaining functionality.
