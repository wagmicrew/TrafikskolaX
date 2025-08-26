# Database Table Removal Scripts

This directory contains scripts for safely removing database tables that have been identified as safe to remove based on comprehensive analysis.

## 📋 Tables Marked for Removal

The following 12 tables have been identified as safe to remove:

- `lesson_content_groups` - Lesson content organization (unused)
- `menu_items` - CMS menu system (unused)
- `notifications` - User notifications (unused)
- `page_images` - CMS page images (unused)
- `pages` - CMS pages (unused)
- `payment_history` - Payment tracking (unused)
- `qliro_orders` - Qliro payment orders (unused)
- `session_bookings` - Session booking system (unused)
- `session_types` - Session type definitions (unused)
- `sessions` - Session management (unused)
- `supervisor_details` - Supervisor details (unused)
- `transactions` - Transaction records (unused)

## 🛠️ Available Scripts

### 1. Dry Run Script
```bash
node scripts/dry-run-table-removal.js
```
**Purpose**: Shows what would happen without making any changes
- Analyzes schema files for references
- Explains database operations
- Shows backup strategy
- Provides safety warnings
- **Safe to run anytime**

### 2. Verification Script
```bash
node scripts/verify-table-removal.js
```
**Purpose**: Checks actual database state
- Verifies table existence
- Counts rows in each table
- Identifies foreign key constraints
- Assesses data loss impact
- **Safe to run anytime**

### 3. Removal Script
```bash
# Show help
node scripts/remove-safe-tables.js --help

# Create backup only (no removal)
node scripts/remove-safe-tables.js --backup-only

# Perform actual removal (USE WITH CAUTION)
node scripts/remove-safe-tables.js --yes
```

## 📋 Step-by-Step Removal Process

### Phase 1: Preparation
```bash
# 1. Dry run to see what would happen
node scripts/dry-run-table-removal.js

# 2. Verify actual database state
node scripts/verify-table-removal.js

# 3. Create manual database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Phase 2: Execution
```bash
# 1. Run removal script (creates automatic backups)
node scripts/remove-safe-tables.js --yes

# 2. Update database types
npm run db:generate

# 3. Test application
npm run dev
```

### Phase 3: Verification
```bash
# 1. Check that tables were removed
node scripts/verify-table-removal.js

# 2. Verify application still works
# Test key functionality like:
# - Booking creation
# - Payment processing
# - User management
# - Theory sessions
```

## 🔧 Script Features

### Safety Measures
- ✅ **Automatic schema backups** before any changes
- ✅ **Transaction-based removal** (rollback on failure)
- ✅ **CASCADE deletion** to handle dependencies
- ✅ **Comprehensive error handling**
- ✅ **Dry-run mode** to preview changes
- ✅ **Row count verification** before removal

### What Gets Modified
1. **Database Tables**: Permanently removed
2. **Schema Files**: Updated to remove table definitions
3. **Type Definitions**: Need regeneration after removal
4. **Migration History**: Handled automatically

### Backup Strategy
1. **Automatic**: Schema files backed up to `lib/db/schema-backup/`
2. **Manual**: Database dump recommended before removal
3. **Rollback**: Both schema and data can be restored

## ⚠️ Critical Warnings

### Data Loss
- **ALL DATA** in removed tables will be permanently deleted
- No recovery possible without backup
- Some tables may contain important historical data

### Dependencies
- Foreign key constraints are handled automatically
- CASCADE deletion removes dependent data
- Schema references are cleaned up automatically

### Application Impact
- May affect application startup if references exist
- Type definitions need regeneration
- Thorough testing required after removal

## 🔍 Verification Checklist

Before running the removal script:

### ✅ Pre-Removal
- [ ] Database backup created
- [ ] Dry run completed successfully
- [ ] Verification script shows all tables are safe
- [ ] No active API references found
- [ ] Team notified of planned maintenance

### ✅ During Removal
- [ ] Script runs without errors
- [ ] Automatic backups created
- [ ] Transaction commits successfully

### ✅ Post-Removal
- [ ] Database types regenerated (`npm run db:generate`)
- [ ] Application starts without errors
- [ ] Key functionality tested
- [ ] No broken API endpoints
- [ ] User interface works correctly

## 🚨 Emergency Rollback

If something goes wrong:

```bash
# 1. Restore from database backup
psql $DATABASE_URL < backup-file.sql

# 2. Restore schema files from backup
cp -r lib/db/schema-backup/* lib/db/schema/

# 3. Regenerate types
npm run db:generate

# 4. Test application
npm run dev
```

## 📞 Support

If you encounter issues:

1. **Check the logs** - Scripts provide detailed output
2. **Review backups** - Automatic backups are created
3. **Check documentation**:
   - `Documentation_new/database-tables-analysis.md`
   - `Documentation_new/database-analysis-cannot-remove.md`
4. **Contact development team** if unsure

## 🎯 Success Metrics

After successful removal:
- ✅ 12 unused tables removed from database
- ✅ Schema files cleaned up
- ✅ Application runs without errors
- ✅ Database size reduced
- ✅ Maintenance overhead decreased

---

**Remember**: Always backup before running destructive operations!
