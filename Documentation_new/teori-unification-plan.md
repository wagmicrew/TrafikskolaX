# Teori & Handledar Unification Plan

## 🎯 **Objective**
Merge `handledar_sessions` into the unified Teori session system to create a single, coherent theoretical lesson booking platform.

## 📋 **Current State Analysis**

### **Separate Systems**
- **Handledar System**: `handledar_sessions` → `handledar_bookings` → `supervisor_details`
- **Teori System**: `teori_sessions` → `teori_bookings` → `teori_supervisors`

### **Table Usage Strategy**
- **Normal driving lessons** → `lesson_types` table
- **Theoretical lessons** → `teori_lesson_types` table (including handledarutbildning, riskettan)

## 🔄 **Unification Architecture**

### **Unified Teori System**
```
teori_lesson_types (all theoretical lessons)
    ↓
teori_sessions (session instances)
    ↓
teori_bookings (student bookings)
    ↓
teori_supervisors (handledare for sessions that require them)
```

### **Lesson Type Classification**
```sql
-- lesson_types: Driving lessons
INSERT INTO lesson_types (name, type) VALUES
('B-körkort', 'driving'),
('A-körkort', 'driving'),
('Taxi-körkort', 'driving');

-- teori_lesson_types: Theoretical lessons
INSERT INTO teori_lesson_types (name, allows_supervisors) VALUES
('Körlektionsteori', false),           -- No handledare
('Handledarutbildning', true),          -- Requires handledare
('Riskettan', true),                    -- Requires handledare
('Första hjälpen', false);              -- No handledare
```

## 💰 **Pricing Model**

### **Base Pricing Structure**
- **Student + 1 Handledare**: Base price included
- **Additional Handledare**: `price_per_supervisor` per extra handledare

### **Example Calculation**
```javascript
// Handledarutbildning session
basePrice = 500;           // Student + 1 handledare
pricePerSupervisor = 400;  // Each additional handledare

// Booking with 3 handledare:
totalPrice = basePrice + (2 * pricePerSupervisor); // 500 + 800 = 1300
```

## 🗃️ **Database Migration Plan**

### **Phase 1: Data Migration**
1. **Migrate handledar_sessions to teori_sessions**:
   ```sql
   INSERT INTO teori_sessions (
     lesson_type_id, title, description, date, start_time, end_time,
     max_participants, current_participants, teacher_id,
     price, reference_id, session_type
   )
   SELECT
     (SELECT id FROM teori_lesson_types WHERE name = 'Handledarutbildning'),
     title, description, date, start_time, end_time,
     max_participants, current_participants, teacher_id,
     price_per_participant, id, 'handledar'
   FROM handledar_sessions;
   ```

2. **Migrate handledar_bookings to teori_bookings**:
   ```sql
   INSERT INTO teori_bookings (
     session_id, student_id, status, price, payment_status,
     participant_name, participant_email, participant_phone,
     participant_personal_number
   )
   SELECT
     ts.id, hb.student_id, hb.status, hb.price, hb.payment_status,
     hb.supervisor_name, hb.supervisor_email, hb.supervisor_phone,
     hb.supervisor_personal_number
   FROM handledar_bookings hb
   JOIN teori_sessions ts ON ts.reference_id = hb.session_id;
   ```

### **Phase 2: Supervisor Migration**
1. **Migrate supervisor_details to teori_supervisors**:
   ```sql
   INSERT INTO teori_supervisors (
     teori_booking_id, supervisor_name, supervisor_email,
     supervisor_phone, supervisor_personal_number, price
   )
   SELECT
     tb.id, sd.supervisor_name, sd.supervisor_email,
     sd.supervisor_phone, sd.supervisor_personal_number,
     hb.price_per_supervisor
   FROM supervisor_details sd
   JOIN handledar_bookings hb ON hb.id = sd.handledar_booking_id
   JOIN teori_bookings tb ON tb.participant_name = hb.supervisor_name
   AND DATE(tb.created_at) = DATE(hb.created_at);
   ```

### **Phase 3: API Updates**
1. **Update lesson selection** to use unified Teori system
2. **Remove handledar-specific APIs**
3. **Update booking flow** for handledare requirements

### **Phase 4: Cleanup**
1. **Remove old tables**: `handledar_sessions`, `handledar_bookings`, `supervisor_details`
2. **Update schema** to remove references
3. **Update documentation**

## 🔧 **Implementation Plan**

### **Step 1: Create Migration API**
```javascript
// /api/admin/migrate/handledar-to-teori
- Migrate all handledar data to unified system
- Preserve all existing bookings and supervisors
- Update references and IDs
```

### **Step 2: Update Lesson Selection**
```javascript
// components/booking/lesson-selection.tsx
const fetchSessionTypes = async () => {
  // 1. Regular driving lessons from lesson_types
  const drivingLessons = await fetch('/api/lesson-types');

  // 2. All theoretical lessons from teori_lesson_types (unified)
  const teoriLessons = await fetch('/api/teori-sessions?scope=future');

  // teoriLessons now includes both regular teori and handledar sessions
}
```

### **Step 3: Update Booking Flow**
```javascript
// If lessonType.allows_supervisors is true:
if (lessonType.allows_supervisors) {
  // Ask for number of handledare (minimum 1)
  const supervisorCount = await askForSupervisorCount();

  // Calculate pricing
  const basePrice = lessonType.price;
  const extraSupervisors = Math.max(0, supervisorCount - 1);
  const totalPrice = basePrice + (extraSupervisors * lessonType.pricePerSupervisor);

  // Require supervisor details
  const supervisors = await collectSupervisorDetails(supervisorCount);
}
```

### **Step 4: Update APIs**
- **`/api/teori-sessions`**: Return all theoretical sessions (teori + handledar)
- **`/api/teori-sessions/[id]/book`**: Handle both types with supervisor logic
- **Remove**: `/api/admin/handledar-sessions` APIs

## 🎯 **Benefits of Unification**

### **User Experience**
- ✅ **Single booking flow** for all theoretical lessons
- ✅ **Clear pricing** with supervisor options
- ✅ **Consistent interface** across lesson types

### **Administrative**
- ✅ **Single system** to manage all theoretical lessons
- ✅ **Unified reporting** and analytics
- ✅ **Simplified maintenance** and updates

### **Technical**
- ✅ **Reduced complexity** - fewer separate systems
- ✅ **Better data consistency** - unified booking model
- ✅ **Easier feature development** - single codebase

## 🚨 **Migration Checklist**

### **Pre-Migration**
- [ ] Create database backup
- [ ] Test migration API with sample data
- [ ] Verify all current handledar bookings are accessible
- [ ] Document current handledar session configurations

### **During Migration**
- [ ] Run migration in maintenance window
- [ ] Monitor for errors and data integrity
- [ ] Update any cached references
- [ ] Test booking flow with both lesson types

### **Post-Migration**
- [ ] Verify all bookings are accessible
- [ ] Test supervisor booking flow
- [ ] Update any hardcoded references
- [ ] Remove old handledar tables
- [ ] Update documentation

## 📋 **API Changes Required**

### **New/Updated Endpoints**
1. **`/api/admin/migrate/handledar-to-teori`** - Migration API
2. **`/api/teori-sessions`** - Enhanced to include handledar sessions
3. **`/api/teori-sessions/[id]/book`** - Enhanced booking logic

### **Removed Endpoints**
1. **`/api/admin/handledar-sessions`** - All handledar session APIs
2. **`/api/admin/handledar-bookings`** - Handledar booking APIs

### **Updated Components**
1. **`components/booking/lesson-selection.tsx`** - Unified lesson loading
2. **`components/booking/booking-confirmation.tsx`** - Supervisor selection logic
3. **Admin dashboard** - Remove handledar-specific management

## ✅ **Success Criteria**

### **Functional**
- ✅ All existing handledar bookings remain accessible
- ✅ New handledar bookings use unified flow
- ✅ Supervisor selection works correctly
- ✅ Pricing calculations are accurate

### **User Experience**
- ✅ Single, intuitive booking flow for all theoretical lessons
- ✅ Clear indication of supervisor requirements
- ✅ Proper pricing display with breakdowns

### **Technical**
- ✅ No data loss during migration
- ✅ Clean database schema
- ✅ Maintainable codebase
- ✅ Comprehensive error handling

---

**This unification will create a seamless, professional theoretical lesson booking experience!** 🎉
