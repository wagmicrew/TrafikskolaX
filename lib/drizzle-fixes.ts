
/**
 * DRIZZLE ORM FIXES AND UTILITIES
 *
 * This file contains common fixes and utilities for Drizzle ORM issues.
 * Import and use these utilities to standardize database operations.
 */

import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, bookings, lessonTypes } from '@/lib/db/schema';

interface UserData {
  name: string;
  age: number;
  email: string;
}


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

// Properly typed function returning UserData
export function getUserData(): UserData {
  return {
    name: "John Doe",
    age: 30,
    email: "john.doe@example.com"
  };
}

// Safe property access with optional chaining
export function processUser(user?: UserData) {
  console.log(user?.name); // Safe access with optional chaining
}

// Proper email validation function
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Usage example:
// const result = await withTransaction(db, async (tx) => {
//   await tx.insert(users).values(userData);
//   await tx.update(accounts).set({ balance }).where(eq(accounts.userId, userId));
//   return { success: true };
// });
    


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

// Common issue patterns and their fixes
export const COMMON_FIXES = {
  // Fix 1: Replace raw SQL with Drizzle ORM
  replaceRawSQL: {
    problem: "await db.execute(sql`SELECT * FROM users WHERE email = ${email}`)",
    solution: "await db.select().from(users).where(eq(users.email, email))"
  },

  // Fix 2: Add transactions for multiple operations
  addTransaction: {
    problem: `
      await db.insert(users).values(userData);
      await db.update(accounts).set({ balance });
    `,
    solution: `
      await withTransaction(db, async (tx) => {
        await tx.insert(users).values(userData);
        await tx.update(accounts).set({ balance });
      });
    `
  },

  // Fix 3: Prevent N+1 queries
  preventN1: {
    problem: `
      const bookings = await db.select().from(bookings);
      for (const booking of bookings) {
        const user = await db.select().from(users).where(eq(users.id, booking.userId));
      }
    `,
    solution: `
      const bookingsWithUsers = await db
        .select({
          booking: bookings,
          user: users
        })
        .from(bookings)
        .leftJoin(users, eq(bookings.userId, users.id));
    `
  }
};

// Typed logging function
export function logMessage(message: string): void {
  console.log(message);
}

// Intentional error: Invalid type assertion
export function convertToUser(obj: any): UserData {
  return obj as UserData; // Unsafe type assertion
}

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

  if (query.includes('WHERE') && query.includes('${') && !query.includes('eq(')) {
    suggestions.push('Use Drizzle eq() instead of raw string interpolation');
  }

  if (query.includes('ORDER BY') && !query.includes('LIMIT')) {
    suggestions.push('Add LIMIT to prevent large result sets');
  }

  return {
    isSecure: !query.includes('${') || query.includes('eq('),
    isOptimized: suggestions.length === 0,
    suggestions
  };
}

export default {
  withTransaction,
  batchLoadUsers,
  loadBookingsWithUsers,
  COMMON_FIXES,
  validateQuery
};
    