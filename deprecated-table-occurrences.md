# Deprecated Table Occurrences Analysis

This document lists all code occurrences of deprecated tables that should be removed from the TrafikskolaX codebase.

## Tables to Remove

The following tables are deprecated and should be removed:
- `supervisor_details`
- `sessions` 
- `session_types`
- `session_bookings`
- `pages`
- `page_images`
- `menu_items`
- `internal_messages`
- `handledar_sessions`
- `handledar_bookings`
- `booking_supervisor_details`

## Tables to Keep (Teori System)

- `teori_session_types` - Groups for sessions with settings like allow supervisor
- `teori_sessions` - Actual sessions with link to session types, price, participants
- `teori_bookings` - Actual bookings for a session
- `teori_supervisors` - Where handledare is stored for a session
- `invoices` - Payment system
- `users` - Student information

---

## Code Occurrences by Table

### 1. `supervisor_details`

#### Schema Files
- `lib/db/schema.ts:490` - Table definition
- `lib/db/schema-backup/` - Backup schema files

#### Migration Files
- `drizzle/migrations/0002_update_lesson_types.sql:26` - Table creation
- `lib/db/migrations/0017_add_booking_supervisor_details.sql` - Related migration

#### Scripts
- `scripts/cleanup-supervisor-data.js:52,109` - Data cleanup operations
- `scripts/create-booking-supervisor-table.js` - Related table creation
- `scripts/test-database-connection.js:74` - Table existence check
- `scripts/verify-table-removal.js:23` - Verification script

#### API Routes
- `app/api/admin/migrate/handledar-to-teori/route.ts:13,137` - Migration logic

#### Documentation
- `Documentation_new/teori-unification-plan.md:9,95,117` - Migration planning
- `Documentation_new/database-tables-analysis.md:346` - Analysis document

### 2. `sessions`

#### Schema Files
- `lib/db/schema/sessions.ts` - Table definition
- `lib/db/schema-backup/` - Backup schema files

#### Migration Files
- `drizzle/migrations/2025-08-24_create_sessions.sql:34` - Table creation

#### Scripts
- `scripts/create-session-tables.js:17,60,62` - Table creation
- `scripts/populate-session-types.js:55,56` - Data population
- `scripts/test-database-connection.js:73` - Table check
- `scripts/verify-table-removal.js:22` - Verification

### 3. `session_types`

#### Schema Files
- `lib/db/schema/session-types.ts:6` - Table definition
- `lib/db/schema-backup/` - Backup schema files

#### Migration Files
- `drizzle/migrations/2025-08-24_create_sessions.sql:14` - Table creation

#### Scripts
- `scripts/create-session-tables.js:17,38,40` - Table creation
- `scripts/populate-session-types.js:10,14,19,22` - Data operations
- `scripts/test-db-connection.js:17,18` - Testing
- `scripts/test-session-apis.js:14,37` - API testing
- `scripts/verify-table-removal.js:21` - Verification

### 4. `session_bookings`

#### Schema Files
- `lib/db/schema/session-bookings.ts:5` - Table definition
- `lib/db/schema-backup/` - Backup schema files

#### Scripts
- `scripts/create-session-tables.js:80,82` - Table creation
- `scripts/populate-session-types.js:76,80,85,88` - Data operations
- `scripts/test-session-apis.js:16` - Testing
- `scripts/test-database-connection.js:71` - Table check
- `scripts/verify-table-removal.js:20` - Verification

### 5. `pages`

#### Schema Files
- `lib/db/schema-backup/*/cms.ts:4` - Table definition (CMS system)

#### Scripts
- `scripts/test-database-connection.js:68` - Table check
- `scripts/verify-table-removal.js:17` - Verification

#### Other References
- `tailwind.config.ts:6` - Build configuration (legitimate use)
- Various component files - Page routing (legitimate use)

### 6. `page_images`

#### Schema Files
- `lib/db/schema-backup/*/cms.ts:37` - Table definition (CMS system)

#### Scripts
- `scripts/test-database-connection.js:67` - Table check
- `scripts/verify-table-removal.js:16` - Verification

### 7. `menu_items`

#### Schema Files
- `lib/db/schema-backup/*/cms.ts:21` - Table definition (CMS system)

#### Scripts
- `scripts/test-database-connection.js:65` - Table check
- `scripts/verify-table-removal.js:14` - Verification

### 8. `booking_supervisor_details`

#### Schema Files
- `lib/db/schema.ts:501` - Table definition

#### Migration Files
- `lib/db/migrations/0017_add_booking_supervisor_details.sql:2,13,16` - Table creation

#### Scripts
- `scripts/create-booking-supervisor-table.js:15,28,34,37` - Table creation

### 9. `handledar_sessions` & `handledar_bookings`

These tables are referenced in migration and cleanup scripts but should be removed as part of the Teori unification.

---

## Replacement Strategy

### For Session Management
Replace deprecated session tables with Teori equivalents:
- `session_types` → `teori_session_types`
- `sessions` → `teori_sessions`  
- `session_bookings` → `teori_bookings`
- `supervisor_details` → `teori_supervisors`

### For CMS Tables
The CMS tables (`pages`, `page_images`, `menu_items`) appear to be unused and can be safely removed.

### For Internal Messages
The `internal_messages` table appears unused and can be removed.

---

## Action Items

### High Priority (Active Code References)
1. **Update Schema Files**: Remove table definitions from `lib/db/schema.ts`
2. **Update API Routes**: Remove or update migration routes in `app/api/admin/migrate/`
3. **Clean Scripts**: Remove or update scripts that reference deprecated tables

### Medium Priority (Documentation & Testing)
1. **Update Documentation**: Remove references in documentation files
2. **Clean Test Scripts**: Update test scripts to use new table structure
3. **Update Migration Scripts**: Archive old migration files

### Low Priority (Archive)
1. **Backup Schema Files**: Archive schema backup files
2. **Migration Files**: Archive old migration files
3. **Verification Scripts**: Update table verification lists

---

## Suggested Prompts for Cleanup

### Chunk 1: Schema and Core Files
```
Remove all references to deprecated tables from the main schema file and core database files:
- lib/db/schema.ts (remove supervisor_details, bookingSupervisorDetails, sessionTypes, sessions, sessionBookings)
- Update any imports or exports that reference these tables
```

### Chunk 2: API Routes
```
Update or remove API routes that reference deprecated tables:
- app/api/admin/migrate/handledar-to-teori/route.ts (update migration logic)
- Remove any API endpoints that specifically handle deprecated tables
```

### Chunk 3: Scripts Cleanup
```
Clean up scripts that reference deprecated tables:
- Remove: scripts/create-session-tables.js, scripts/populate-session-types.js
- Update: scripts/test-database-connection.js, scripts/verify-table-removal.js
- Archive: scripts/cleanup-supervisor-data.js
```

### Chunk 4: Documentation Update
```
Update documentation to reflect new table structure:
- Documentation_new/teori-unification-plan.md
- Documentation_new/database-tables-analysis.md
- Remove references to deprecated tables, update with teori_* equivalents
```

### Chunk 5: Migration Files
```
Archive old migration files and create final cleanup migration:
- Archive: drizzle/migrations/2025-08-24_create_sessions.sql
- Archive: lib/db/migrations/0017_add_booking_supervisor_details.sql
- Create new migration to ensure deprecated tables are dropped
```
