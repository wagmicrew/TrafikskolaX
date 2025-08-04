import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, like, desc } from 'drizzle-orm';

/**
 * Generates the next available customer number in DTS format
 * Example: DTS0001, DTS0002, DTS0003, etc.
 */
export async function generateCustomerNumber(): Promise<string> {
  try {
    // Get the highest existing customer number
    const latestUser = await db
      .select({ customerNumber: users.customerNumber })
      .from(users)
      .where(
        and(
          eq(users.role, 'student'),
          like(users.customerNumber, 'DTS%')
        )
      )
      .orderBy(desc(users.customerNumber))
      .limit(1);

    let nextNumber = 1;

    if (latestUser.length > 0 && latestUser[0].customerNumber) {
      // Extract the number part from DTS0001 format
      const currentNumber = latestUser[0].customerNumber.replace('DTS', '');
      nextNumber = parseInt(currentNumber, 10) + 1;
    }

    // Format as DTS + 4-digit number with leading zeros
    return `DTS${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating customer number:', error);
    // Fallback to a simple timestamp-based number if there's an error
    const timestamp = Date.now().toString().slice(-4);
    return `DTS${timestamp}`;
  }
}
