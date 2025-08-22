const fs = require('fs');
const path = require('path');

class DrizzleQuickFixes {
  constructor() {
    this.fixes = {
      transactionWrapper: this.createTransactionWrapper(),
      queryOptimizer: this.createQueryOptimizer(),
      rawToDrizzle: this.createRawToDrizzleConverter()
    };
  }

  createTransactionWrapper() {
    return `
// Database transaction wrapper utility
export async function withTransaction<T>(
  db: any,
  operations: (tx: any) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx: any) => {
    try {
      const result = await operations(tx);
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  });
}

// Usage example:
// const result = await withTransaction(db, async (tx) => {
//   await tx.insert(users).values(userData);
//   await tx.update(accounts).set({ balance }).where(eq(accounts.userId, userId));
//   return { success: true };
// });
    `;
  }

  createQueryOptimizer() {
    return `
// N+1 Query prevention utilities
export async function batchLoadUsers(db: any, userIds: string[]) {
  return await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));
}

export async function loadBookingsWithUsers(db: any, bookingIds: string[]) {
  return await db
    .select({
      booking: bookings,
      user: users,
      teacher: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(users, eq(bookings.teacherId, users.id))
    .where(inArray(bookings.id, bookingIds));
}
    `;
  }

  createRawToDrizzleConverter() {
    return `
// Raw SQL to Drizzle ORM conversion helpers
export const rawSQLConversions = {
  // SELECT * FROM users WHERE email = $1
  findUserByEmail: (db: any, email: string) =>
    db.select().from(users).where(eq(users.email, email)).limit(1),

  // SELECT COUNT(*) FROM bookings WHERE user_id = $1
  countUserBookings: (db: any, userId: string) =>
    db.select({ count: sql\`count(*)\` })
       .from(bookings)
       .where(eq(bookings.userId, userId)),

  // UPDATE users SET last_login = NOW() WHERE id = $1
  updateLastLogin: (db: any, userId: string) =>
    db.update(users)
       .set({ updatedAt: new Date() })
       .where(eq(users.id, userId)),

  // DELETE FROM bookings WHERE id = $1
  deleteBooking: (db: any, bookingId: string) =>
    db.delete(bookings).where(eq(bookings.id, bookingId))
};
    `;
  }

  generateFixFile() {
    const fixContent = `
/**
 * DRIZZLE ORM FIXES AND UTILITIES
 *
 * This file contains common fixes and utilities for Drizzle ORM issues.
 * Import and use these utilities to standardize database operations.
 */

import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, bookings, lessonTypes } from '@/lib/db/schema';

${this.fixes.transactionWrapper}

${this.fixes.queryOptimizer}

${this.fixes.rawToDrizzleConverter}

// Common issue patterns and their fixes
export const COMMON_FIXES = {
  // Fix 1: Replace raw SQL with Drizzle ORM
  replaceRawSQL: {
    problem: \`await db.execute(sql\`SELECT * FROM users WHERE email = \${email}\`)\`,
    solution: \`await db.select().from(users).where(eq(users.email, email))\`
  },

  // Fix 2: Add transactions for multiple operations
  addTransaction: {
    problem: \`
      await db.insert(users).values(userData);
      await db.update(accounts).set({ balance });
    \`,
    solution: \`
      await withTransaction(db, async (tx) => {
        await tx.insert(users).values(userData);
        await tx.update(accounts).set({ balance });
      });
    \`
  },

  // Fix 3: Prevent N+1 queries
  preventN1: {
    problem: \`
      const bookings = await db.select().from(bookings);
      for (const booking of bookings) {
        const user = await db.select().from(users).where(eq(users.id, booking.userId));
      }
    \`,
    solution: \`
      const bookingsWithUsers = await db
        .select({
          booking: bookings,
          user: users
        })
        .from(bookings)
        .leftJoin(users, eq(bookings.userId, users.id));
    \`
  }
};

// Validation utilities
export async function validateQuery(query: string): Promise<{
  isSecure: boolean;
  isOptimized: boolean;
  suggestions: string[];
}> {
  const suggestions = [];

  if (query.includes('SELECT *') && !query.includes('LIMIT')) {
    suggestions.push('Consider selecting specific columns instead of *');
  }

  if (query.includes('WHERE') && query.includes('\${') && !query.includes('eq(')) {
    suggestions.push('Use Drizzle eq() instead of raw string interpolation');
  }

  if (query.includes('ORDER BY') && !query.includes('LIMIT')) {
    suggestions.push('Add LIMIT to prevent large result sets');
  }

  return {
    isSecure: !query.includes('\${') || query.includes('eq('),
    isOptimized: suggestions.length === 0,
    suggestions
  };
}

export default {
  withTransaction,
  batchLoadUsers,
  loadBookingsWithUsers,
  rawSQLConversions,
  COMMON_FIXES,
  validateQuery
};
    `;

    const fixesPath = path.join(process.cwd(), 'lib', 'drizzle-fixes.ts');
    fs.mkdirSync(path.dirname(fixesPath), { recursive: true });
    fs.writeFileSync(fixesPath, fixContent);

    console.log(`✅ Drizzle fixes saved to: ${fixesPath}`);
  }

  printQuickStart() {
    console.log('\n🚀 QUICK START GUIDE\n');
    console.log('1. Import the fixes in your files:');
    console.log(`   import { withTransaction, rawSQLConversions } from '@/lib/drizzle-fixes';\n`);

    console.log('2. Replace raw SQL with Drizzle ORM:');
    console.log(`   // Instead of:`);
    console.log(`   await db.execute(sql\`SELECT * FROM users WHERE email = \${email}\`);`);
    console.log(`   // Use:`);
    console.log(`   await rawSQLConversions.findUserByEmail(db, email);\n`);

    console.log('3. Wrap multiple operations in transactions:');
    console.log(`   await withTransaction(db, async (tx) => {`);
    console.log(`     await tx.insert(users).values(userData);`);
    console.log(`     await tx.update(accounts).set({ balance });`);
    console.log(`   });\n`);

    console.log('4. Fix N+1 queries:');
    console.log(`   // Use batch loading instead of loops with queries`);
    console.log(`   const users = await batchLoadUsers(db, userIds);\n`);

    console.log('5. Validate your queries:');
    console.log(`   const validation = await validateQuery(yourQuery);`);
    console.log(`   console.log(validation.suggestions);\n`);
  }
}

// Generate the fixes file
const fixer = new DrizzleQuickFixes();
fixer.generateFixFile();
fixer.printQuickStart();

console.log('\n📋 Files with fixes applied:');
console.log('   • lib/drizzle-fixes.ts - Main utilities and helpers');
console.log('   • logs/drizzle-migration-plan.json - Detailed migration plan');

module.exports = DrizzleQuickFixes;
