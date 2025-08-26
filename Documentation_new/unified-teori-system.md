# Unified Teori & Handledar System

## 🎯 **Overview**
The booking system now uses a **unified theoretical lesson platform** that seamlessly handles both regular Teori sessions and Handledar/Supervisor training sessions under a single, cohesive system.

## 📋 **System Architecture**

### **Table Usage Strategy**
```
Regular Driving Lessons → lesson_types table
Theoretical Lessons → teori_lesson_types table (UNIFIED)
```

### **Database Structure**
```sql
-- Regular driving lessons
lesson_types (
  id, name, description, duration_minutes, price, price_student, is_active
)

-- ALL theoretical lessons (unified)
teori_lesson_types (
  id, name, description, allows_supervisors, price, price_per_supervisor,
  duration_minutes, max_participants, is_active, sort_order
)

-- Sessions for theoretical lessons
teori_sessions (
  id, lesson_type_id, title, date, start_time, end_time,
  max_participants, current_participants, session_type, is_active
)

-- Bookings for theoretical lessons
teori_bookings (
  id, session_id, student_id, participant_name, participant_email,
  status, price, payment_status, created_at
)

-- Supervisors for sessions that require them
teori_supervisors (
  id, teori_booking_id, supervisor_name, supervisor_email,
  supervisor_phone, supervisor_personal_number, price, created_at
)
```

## 🎓 **Lesson Type Classification**

### **Regular Driving Lessons** (uses `lesson_types`)
```javascript
// Examples:
{
  name: "B-körkort",
  type: "driving",
  price: 500,
  durationMinutes: 45
}
```

### **Theoretical Lessons** (uses `teori_lesson_types`)

#### **Regular Teori Lessons** (no supervisors required)
```javascript
{
  name: "Körlektionsteori",
  allowsSupervisors: false,
  price: 300,
  durationMinutes: 60,
  maxParticipants: 1
}
```

#### **Handledar/Supervisor Lessons** (supervisors required)
```javascript
{
  name: "Handledarutbildning",
  allowsSupervisors: true,
  price: 500,           // Base: 1 student + 1 supervisor
  pricePerSupervisor: 400,  // Each additional supervisor
  durationMinutes: 120,
  maxParticipants: 2
}
```

## 💰 **Pricing Model**

### **New Unified Pricing**
- **Base Price**: Includes 1 student + 1 supervisor (for handledar lessons)
- **Additional Supervisors**: `price_per_supervisor` per extra supervisor
- **Student Always Required**: Every booking must have a student

### **Examples**

#### **Regular Teori Lesson** (no supervisors)
```javascript
lessonType: {
  name: "Körlektionsteori",
  allowsSupervisors: false,
  price: 300
}
// Total: 300 kr (1 student, no supervisor requirement)
```

#### **Handledar Lesson** (with supervisors)
```javascript
lessonType: {
  name: "Handledarutbildning",
  allowsSupervisors: true,
  price: 500,              // Base: 1 student + 1 supervisor
  pricePerSupervisor: 400  // Each additional supervisor
}

// Examples:
supervisors = 1 → Total: 500 kr (base price)
supervisors = 2 → Total: 500 kr (base) + 400 kr (1 extra) = 900 kr
supervisors = 3 → Total: 500 kr (base) + 800 kr (2 extra) = 1300 kr
```

## 🔄 **API Endpoints**

### **1. Lesson Selection**
```javascript
// /api/lesson-types → Regular driving lessons only
fetch('/api/lesson-types')
  .then(res => res.json())
  .then(data => data.lessonTypes) // Driving lessons

// /api/teori-sessions → ALL theoretical lessons (unified)
fetch('/api/teori-sessions?scope=future')
  .then(res => res.json())
  .then(data => {
    // Both regular Teori and Handledar sessions
    const lessonTypes = data.sessionsByType;
    const teoriLessons = lessonTypes.filter(lt => !lt.lessonType.allows_supervisors);
    const handledarLessons = lessonTypes.filter(lt => lt.lessonType.allows_supervisors);
  });
```

### **2. Booking Creation**
```javascript
// /api/teori/create-booking → Unified booking for all theoretical lessons
const bookingData = {
  sessionId: "session-uuid",
  customerInfo: {
    firstName: "Student",
    lastName: "Name",
    email: "student@example.com",
    phone: "0701234567"
  },
  supervisors: [
    {
      name: "Supervisor One",
      email: "supervisor@example.com",
      phone: "0709876543",
      personalNumber: "19800101-1234"
    }
  ]
};
```

## 🎨 **Frontend Integration**

### **Lesson Selection Component**
```javascript
// components/booking/lesson-selection.tsx
const fetchSessionTypes = async () => {
  // 1. Regular driving lessons from lesson_types
  const drivingLessons = await fetch('/api/lesson-types');

  // 2. ALL theoretical lessons from teori_lesson_types (unified)
  const theoreticalLessons = await fetch('/api/teori-sessions?scope=future');

  // theoreticalLessons now contains both:
  // - Regular Teori sessions (allows_supervisors: false)
  // - Handledar sessions (allows_supervisors: true)
};
```

### **Booking Confirmation Component**
```javascript
// components/booking/booking-confirmation.tsx

// Check if supervisors are required
const allowsSupervisors = bookingData.lessonType?.allowsSupervisors || false;

// Validate minimum supervisor requirement
if (allowsSupervisors && supervisorCount < 1) {
  showNotification('Handledare krävs', 'Minst en handledare måste registreras', 'error');
  return;
}

// Calculate pricing (base price includes 1 supervisor)
const extraSupervisors = Math.max(0, supervisorCount - 1);
const finalTotalPrice = bookingData.totalPrice + (extraSupervisors * pricePerSupervisor);
```

## 🔧 **Migration Status**

### **✅ Completed**
- ✅ **Lesson selection unified** - Single API for all theoretical lessons
- ✅ **Pricing model updated** - Base price includes one supervisor
- ✅ **Validation added** - Ensures supervisors for handledar sessions
- ✅ **API endpoints updated** - Proper separation and filtering
- ✅ **Database structure ready** - All tables support unified system

### **📋 Next Steps**
1. **Run migration API** to move existing handledar data (optional)
2. **Test booking flow** with different lesson types
3. **Verify pricing** calculations in UI
4. **Update documentation** for administrators

## 🧪 **Testing the System**

### **Quick Test Script**
```bash
node scripts/test-unified-teori-system.js
```

This script will:
- ✅ Check database connectivity
- ✅ Verify table structures
- ✅ Test lesson type distribution
- ✅ Validate API endpoints
- ✅ Show pricing examples

### **Manual Testing Checklist**
```javascript
// Test 1: Regular Teori Lesson
const regularTeori = {
  lessonType: "Körlektionsteori",
  allowsSupervisors: false,
  supervisors: [] // No supervisors needed
};

// Test 2: Handledar Lesson
const handledarLesson = {
  lessonType: "Handledarutbildning",
  allowsSupervisors: true,
  supervisors: [
    { name: "Supervisor One", email: "sup@example.com" }
  ] // At least one required
};

// Test 3: Multiple Supervisors
const multipleSupervisors = {
  lessonType: "Riskettan",
  allowsSupervisors: true,
  supervisors: [
    { name: "Supervisor One", email: "sup1@example.com" },
    { name: "Supervisor Two", email: "sup2@example.com" }
  ]
};
```

## 📚 **API Reference**

### **Create Theoretical Lesson Type**
```javascript
POST /api/admin/teori-lesson-types
{
  "name": "Riskettan",
  "description": "Risk education course",
  "allowsSupervisors": true,
  "price": 600,              // Base: 1 student + 1 supervisor
  "pricePerSupervisor": 450, // Each additional supervisor
  "durationMinutes": 180,
  "maxParticipants": 3,
  "isActive": true,
  "sortOrder": 1
}
```

### **Get Theoretical Sessions**
```javascript
GET /api/teori-sessions?scope=future
// Returns all theoretical lesson types with available sessions
```

### **Book Theoretical Session**
```javascript
POST /api/teori/create-booking
{
  "sessionId": "uuid",
  "customerInfo": {
    "firstName": "Student",
    "lastName": "Name",
    "email": "student@example.com",
    "phone": "0701234567"
  },
  "supervisors": [/* Required if allows_supervisors = true */]
}
```

## 🎯 **Key Benefits**

### **✅ User Experience**
- **Single booking flow** for all theoretical lessons
- **Clear pricing** with supervisor breakdown
- **Intuitive interface** - no confusion between Teori/Handledar
- **Flexible supervisor selection** (when required)

### **✅ Administrative**
- **Unified management** - one system for all theoretical lessons
- **Consistent data structure** - all theoretical bookings in same tables
- **Simplified reporting** - single source of truth
- **Easier maintenance** - fewer separate systems

### **✅ Technical**
- **Reduced complexity** - consolidated codebase
- **Better performance** - unified queries and caching
- **Cleaner architecture** - clear separation of concerns
- **Future-proof** - easy to add new theoretical lesson types

## 🚨 **Important Notes**

### **Supervisor Requirements**
- ✅ **Handledar sessions** (`allows_supervisors: true`) require at least 1 supervisor
- ✅ **Regular Teori sessions** (`allows_supervisors: false`) don't require supervisors
- ✅ **Student always required** on all bookings

### **Pricing Calculation**
- ✅ **Base price** = 1 student + 1 supervisor (for handledar sessions)
- ✅ **Extra supervisors** charged at `price_per_supervisor` each
- ✅ **Regular Teori** sessions have no supervisor charges

### **Data Migration**
- ✅ **Existing handledar data** can be migrated using the migration API
- ✅ **New system** maintains backward compatibility
- ✅ **No data loss** during transition

---

**The unified Teori system provides a seamless, professional experience for all theoretical lesson bookings!** 🎉

**Next**: Run `node scripts/test-unified-teori-system.js` to verify everything is working correctly.
