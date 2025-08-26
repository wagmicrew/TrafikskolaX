# Booking Flow Table Separation

## ✅ Table Usage Separation Implemented

This document outlines the changes made to ensure proper table separation in the booking flow, with Teori sessions using only `teori_lesson_types`.

## 📋 Table Usage by Lesson Type

### **Regular Driving Lessons** (`type: 'lesson'`)
- **Table**: `lesson_types`
- **API Endpoint**: `/api/lesson-types`
- **Schema**: `lessonTypes` from `lib/db/schema.ts`
- **Purpose**: B-körkort, A-körkort, taxi license, assessment, theory lessons
- **Features**: Standard pricing, duration, student pricing

### **Teori Sessions** (`type: 'teori'`)
- **Table**: `teori_lesson_types`
- **API Endpoint**: `/api/teori-sessions`
- **Schema**: Raw SQL queries (not in Drizzle schema)
- **Purpose**: Theory sessions with specific Teori features
- **Features**: Supervisor support, participant limits, sort ordering

### **Handledar/Supervisor Training** (`type: 'handledar'`)
- **Table**: `session_types`
- **API Endpoint**: `/api/session-types`
- **Schema**: Raw SQL queries (not in Drizzle schema)
- **Purpose**: Handledarutbildning, riskettan courses
- **Features**: Multi-supervisor support, specialized pricing

## 🔄 Changes Made

### **1. Updated Lesson Selection Component**
**File**: `components/booking/lesson-selection.tsx`

**Before**:
```javascript
// Mixed loading from multiple sources
const lessonResponse = await fetch('/api/lesson-types')        // All lesson types
const sessionTypesResponse = await fetch('/api/session-types') // All session types
```

**After**:
```javascript
// Separated by specific purpose
const lessonResponse = await fetch('/api/lesson-types')        // Driving lessons only
const teoriResponse = await fetch('/api/teori-sessions')       // Teori only
const sessionTypesResponse = await fetch('/api/session-types') // Handledar only
```

### **2. Updated Session Types API**
**File**: `app/api/session-types/route.ts`

**Added Filter**:
```sql
WHERE is_active = true
AND type IN ('handledarutbildning', 'riskettan')  -- Only handledar sessions
```

**Result**: This API now exclusively returns handledar/supervisor training sessions.

### **3. Clear Separation Logic**
**File**: `components/booking/lesson-selection.tsx`

```javascript
// 1. Regular lessons from lesson_types
const lessons = lessonData.lessonTypes.map(lesson => ({
  ...lesson,
  type: 'lesson',
  basePrice: lesson.price
}))

// 2. Teori sessions from teori_lesson_types
const teoriSessions = teoriData.sessionsByType.map(group => ({
  ...group.lessonType,
  type: 'teori',
  hasAvailableSessions: group.hasAvailableSessions
}))

// 3. Handledar sessions from session_types
const handledarSessions = sessionTypesData.sessionTypes.map(sessionType => ({
  ...sessionType,
  type: 'handledar'
}))
```

## 📊 Data Flow Summary

### **Booking Creation Process**

#### **Regular Driving Lessons**:
1. **Selection**: `/api/lesson-types` → `lesson_types` table
2. **Creation**: `app/api/booking/create/route.ts` → `bookings` table
3. **Reference**: Uses `lessonTypes.id` from `lesson_types` table

#### **Teori Sessions**:
1. **Selection**: `/api/teori-sessions` → `teori_lesson_types` table
2. **Creation**: `app/api/teori-sessions/[id]/book/route.ts` → `teori_bookings` table
3. **Reference**: Uses `teori_lesson_types.id` from `teori_lesson_types` table

#### **Handledar Sessions**:
1. **Selection**: `/api/session-types` → `session_types` table (filtered)
2. **Creation**: Uses existing handledar booking system
3. **Reference**: Uses `session_types.id` from `session_types` table

## 🛡️ Validation

### **API Endpoint Validation**
- ✅ `/api/lesson-types` - Returns only driving lesson types
- ✅ `/api/teori-sessions` - Returns only Teori lesson types
- ✅ `/api/session-types` - Returns only handledar session types

### **Database Schema Validation**
- ✅ `lesson_types` - Used only for regular driving lessons
- ✅ `teori_lesson_types` - Used only for Teori sessions
- ✅ `session_types` - Used only for handledar/supervisor training

### **Component Validation**
- ✅ `LessonSelection` component loads from correct APIs
- ✅ No cross-contamination between lesson types
- ✅ Clear type separation maintained

## 🎯 Benefits

### **Data Integrity**
- ✅ No mixing of lesson types across different systems
- ✅ Proper foreign key relationships maintained
- ✅ Clear separation of concerns

### **Performance**
- ✅ Smaller, targeted API responses
- ✅ Reduced database query complexity
- ✅ Better caching opportunities

### **Maintainability**
- ✅ Clear understanding of which table serves which purpose
- ✅ Easier debugging and troubleshooting
- ✅ Simplified feature development

## 🚨 Important Notes

### **Migration Consideration**
If you have existing Teori sessions in the wrong table, you may need to migrate them:

```sql
-- Check for any Teori sessions in lesson_types (should be empty)
SELECT * FROM lesson_types WHERE name LIKE '%teori%' OR name LIKE '%theory%';

-- Check for Teori sessions in teori_lesson_types (should contain all)
SELECT * FROM teori_lesson_types WHERE is_active = true;
```

### **API Consistency**
- Regular lessons continue to use the existing `lesson_types` table
- Teori sessions are now exclusively in `teori_lesson_types`
- Handledar sessions remain in `session_types` with proper filtering

### **Future Development**
- When adding new lesson types, choose the appropriate table:
  - **Driving lessons** → `lesson_types`
  - **Theory sessions** → `teori_lesson_types`
  - **Supervisor training** → `session_types`

## ✅ Verification

To verify the separation is working correctly:

1. **Check lesson selection**: Each type should load from correct API
2. **Verify booking creation**: Each type should create in correct table
3. **Test API responses**: Each endpoint should return relevant data only

**The booking flow now has clear table separation with Teori sessions exclusively using `teori_lesson_types`!** 🎉
