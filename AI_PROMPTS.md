# AI Prompts for Remaining TODOs

## 🚀 **TrafikskolaX - Development Tasks & Editor Migration**

## 📝 **Editor Migration Complete: Quill/TinyMCE → Puck**

### ✅ **Migration Summary:**
- **Removed**: Quill editor, TinyMCE dependencies
- **Added**: @measured/puck - Modern visual editor
- **Updated**: SimpleRichEditor component with Puck configuration
- **Status**: All TypeScript errors resolved, build successful

### 🛠️ **Puck Editor Features:**
- **Visual Block Editing**: Drag-and-drop content blocks
- **Component Library**: Headings, paragraphs, text, lists, links, images
- **Live Preview**: Real-time content rendering
- **Responsive Design**: Automatic mobile optimization
- **Type Safety**: Full TypeScript support

### 📋 **Current TODO Status**
- **Total TODOs:** 3 remaining
- **Priority:** Medium
- **Estimated Time:** 2-4 hours

---

## 🎯 **TODO #1: Pay at Location Implementation**

### **Location:** `app/boka-korning/page.tsx:323`

### **Current State:**
```javascript
// TODO: Implement pay at location
handleCreditPayment(bookingData.bookingId || '');
```

### **AI Prompt:**
```
I need you to implement the "Pay at Location" functionality in the booking flow. Currently there's a TODO comment at line 323 in app/boka-korning/page.tsx.

**Requirements:**
1. Create a payment option for "Betala på plats" (Pay at Location)
2. This should be available for students with less than 2 unpaid bookings
3. Update the booking status to indicate payment will be collected at the lesson
4. Add appropriate UI feedback and confirmation messages
5. Ensure the booking flow continues properly after selecting this option
6. Update the database schema if needed to track this payment method

**Current Implementation:**
- The payment method exists in the UI but the backend logic is missing
- The `handleCreditPayment` function is called but needs to handle "pay at location" differently
- Need to integrate with existing booking confirmation flow

**Files to examine:**
- `app/boka-korning/page.tsx` - Main booking flow
- `components/booking/booking-confirmation.tsx` - Payment confirmation
- `app/api/booking/confirm/route.ts` - Backend booking confirmation
- `lib/db/schema.ts` - Database schema for payment tracking

**Expected Result:**
- Complete "Pay at Location" payment flow
- Proper database tracking
- User feedback and confirmation
- Integration with existing booking system

**Note:** Email templates now use Puck editor instead of Quill/TinyMCE
```

---

## 🎯 **TODO #2: PDF Generation for User Deletion**

### **Location:** `app/api/admin/users/delete-with-bookings/route.ts:139`

### **Current State:**
```javascript
// TODO: Implement actual PDF generation
return NextResponse.json({ success: false, error: 'PDF generation not implemented yet' });
```

### **AI Prompt:**
```
I need you to implement PDF generation functionality for the user deletion with bookings feature. Currently there's a TODO at line 139 in app/api/admin/users/delete-with-bookings/route.ts.

**Requirements:**
1. Generate a PDF report containing all user bookings before deletion
2. Include booking details, dates, payments, and lesson information
3. Use a PDF generation library (like jsPDF, Puppeteer, or React-PDF)
4. Format the PDF with company branding and proper structure
5. Save the PDF temporarily for download or email it to admin
6. Handle errors gracefully and provide fallback options

**Current Implementation:**
- The API endpoint exists but returns a "not implemented" error
- The endpoint receives user data and booking information
- Need to create a comprehensive PDF report before user deletion

**Files to examine:**
- `app/api/admin/users/delete-with-bookings/route.ts` - Main API endpoint
- `lib/db/schema.ts` - Database schema for bookings and user data
- `app/dashboard/admin/users/[id]/page.tsx` - Admin user management UI

**Expected Result:**
- Complete PDF generation functionality
- Professional-looking PDF reports
- Error handling and fallback options
- Integration with existing user deletion flow

**Note:** Email templates now use Puck editor instead of Quill/TinyMCE
```

---

## 🎯 **TODO #3: Messages System Integration**

### **Location:** `app/api/admin/dashboard-stats/route.ts:61`

### **Current State:**
```javascript
const unreadMessages = 0; // TODO: Implement when messages system is ready
```

### **AI Prompt:**
```
I need you to implement the messages system integration in the dashboard statistics. Currently there's a TODO at line 61 in app/api/admin/dashboard-stats/route.ts where unread messages is hardcoded to 0.

**Requirements:**
1. Connect to the existing messages system
2. Count unread messages for the current admin user
3. Update the dashboard stats to show real unread message count
4. Ensure proper database queries for message status
5. Handle edge cases (no messages, database errors, etc.)
6. Update the dashboard UI to display the message count

**Current Implementation:**
- The dashboard stats API exists but hardcodes unread messages to 0
- There's an existing messages system in the app
- Need to integrate real message counting functionality

**Files to examine:**
- `app/api/admin/dashboard-stats/route.ts` - Dashboard stats API
- `app/api/messages/route.ts` - Messages API endpoints
- `lib/db/schema.ts` - Database schema for messages
- `app/dashboard/admin/page.tsx` - Dashboard UI that uses these stats

**Expected Result:**
- Real unread message count in dashboard stats
- Proper integration with messages system
- Error handling for database queries
- Updated dashboard UI to show message statistics

**Note:** Email templates now use Puck editor instead of Quill/TinyMCE
```

---

## 🔧 **Implementation Strategy**

### **Step 1: Priority Implementation**
```bash
# Start with the most impactful TODO
1. Pay at Location (affects user booking flow)
2. PDF Generation (admin functionality)
3. Messages Integration (dashboard feature)
```

### **Step 2: Testing Strategy**
```javascript
// Test each implementation thoroughly
- Unit tests for new functionality
- Integration tests with existing systems
- Error handling and edge cases
- UI/UX validation
```

### **Step 3: Documentation**
```javascript
// Update documentation for each feature
- API documentation
- User-facing help text
- Admin documentation
```

---

## 🎯 **AI Assistant Instructions**

**For each TODO, provide:**
1. **Complete implementation** with proper error handling
2. **Database integration** if needed
3. **UI updates** for consistency
4. **Testing strategy** with sample data
5. **Documentation** updates

**Focus on:**
- ✅ **Code Quality**: Clean, maintainable code
- ✅ **Error Handling**: Proper error messages and fallbacks
- ✅ **Performance**: Efficient database queries
- ✅ **Security**: Proper authentication and validation
- ✅ **User Experience**: Intuitive and responsive UI

---

## 🚀 **Quick Implementation Commands**

```bash
# 1. Pay at Location Implementation
# Focus: app/boka-korning/page.tsx:323

# 2. PDF Generation Implementation
# Focus: app/api/admin/users/delete-with-bookings/route.ts:139

# 3. Messages System Integration
# Focus: app/api/admin/dashboard-stats/route.ts:61
```

---

## 📊 **Expected Outcomes**

After implementing all TODOs:
- ✅ **Complete booking flow** with all payment options
- ✅ **Professional PDF reports** for admin operations
- ✅ **Real-time dashboard statistics** with accurate data
- ✅ **Improved user experience** across all features
- ✅ **Better admin tools** for user management

**Ready to implement?** 🚀
