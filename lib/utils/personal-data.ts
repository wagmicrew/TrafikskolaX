import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { supervisorDetails } from '@/lib/db/schema';
import { eq, and, lt, isNotNull } from 'drizzle-orm';

// Encryption/decryption utilities for personal data
export class PersonalDataManager {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Encrypt personal number using bcrypt
   */
  static async encryptPersonalNumber(personalNumber: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return await bcrypt.hash(personalNumber, salt);
  }

  /**
   * Verify personal number against encrypted version
   */
  static async verifyPersonalNumber(personalNumber: string, encryptedVersion: string): Promise<boolean> {
    return await bcrypt.compare(personalNumber, encryptedVersion);
  }

  /**
   * Clean up personal data after course completion
   * Removes personal numbers from supervisor details after the course has ended
   */
  static async cleanupCompletedCourses(): Promise<{ cleaned: number }> {
    try {
      // Find courses that have ended (more than 30 days ago)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get all supervisor details for completed courses
      const completedCourses = await db
        .select({
          id: supervisorDetails.id,
          bookingId: supervisorDetails.handledarBookingId,
          courseDate: supervisorDetails.createdAt,
        })
        .from(supervisorDetails)
        .where(
          and(
            lt(supervisorDetails.createdAt, thirtyDaysAgo),
            // Only clean if personal number exists
            isNotNull(supervisorDetails.supervisorPersonalNumber)
          )
        );

      let cleanedCount = 0;

      for (const record of completedCourses) {
        // Update the record to remove personal number
        await db
          .update(supervisorDetails)
          .set({
            supervisorPersonalNumber: null,
            updatedAt: new Date(),
          })
          .where(eq(supervisorDetails.id, record.id));

        cleanedCount++;
      }

      console.log(`[PersonalDataManager] Cleaned up ${cleanedCount} personal numbers from completed courses`);

      return { cleaned: cleanedCount };
    } catch (error) {
      console.error('[PersonalDataManager] Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Get data retention statistics
   */
  static async getRetentionStats(): Promise<{
    totalRecords: number;
    recordsWithPersonalData: number;
    completedCourses: number;
    pendingCleanup: number;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [totalRecords, recordsWithPersonalData, completedCourses, pendingCleanup] = await Promise.all([
        // Total supervisor records
        db.select({ count: 'count' }).from(supervisorDetails),

        // Records with personal data
        db.select({ count: 'count' })
          .from(supervisorDetails)
          .where(isNotNull(supervisorDetails.supervisorPersonalNumber)),

        // Completed courses (older than 30 days)
        db.select({ count: 'count' })
          .from(supervisorDetails)
          .where(lt(supervisorDetails.createdAt, thirtyDaysAgo)),

        // Pending cleanup (completed courses with personal data)
        db.select({ count: 'count' })
          .from(supervisorDetails)
          .where(
            and(
              lt(supervisorDetails.createdAt, thirtyDaysAgo),
              isNotNull(supervisorDetails.supervisorPersonalNumber)
            )
          )
      ]);

      return {
        totalRecords: parseInt(totalRecords[0].count as string),
        recordsWithPersonalData: parseInt(recordsWithPersonalData[0].count as string),
        completedCourses: parseInt(completedCourses[0].count as string),
        pendingCleanup: parseInt(pendingCleanup[0].count as string),
      };
    } catch (error) {
      console.error('[PersonalDataManager] Error getting retention stats:', error);
      throw error;
    }
  }

  /**
   * Validate Swedish personal number format
   */
  static validatePersonalNumber(personalNumber: string): boolean {
    // Remove any hyphens or spaces
    const cleanNumber = personalNumber.replace(/[-\s]/g, '');

    // Check if it's 12 digits (with century) or 10 digits (without century)
    if (cleanNumber.length === 12) {
      // 12 digits: YYMMDDXXXX (century included)
      const year = parseInt(cleanNumber.slice(0, 2));
      const month = parseInt(cleanNumber.slice(2, 4));
      const day = parseInt(cleanNumber.slice(4, 6));
      const lastFour = cleanNumber.slice(8);

      return this.isValidDate(1900 + year, month, day) && /^\d{4}$/.test(lastFour);
    } else if (cleanNumber.length === 10) {
      // 10 digits: YYMMDDXXXX (century not included)
      const month = parseInt(cleanNumber.slice(2, 4));
      const day = parseInt(cleanNumber.slice(4, 6));
      const lastFour = cleanNumber.slice(6);

      return this.isValidDate(1900, month, day) && /^\d{4}$/.test(lastFour);
    }

    return false;
  }

  /**
   * Format personal number for display (mask sensitive digits)
   */
  static formatPersonalNumber(personalNumber: string): string {
    // Remove any existing formatting
    const cleanNumber = personalNumber.replace(/[-\s]/g, '');

    if (cleanNumber.length === 12) {
      // YYYYMMDD-XXXX -> YYYYMMDD-XXXX (masked)
      return `${cleanNumber.slice(0, 8)}-${cleanNumber.slice(8)}`;
    } else if (cleanNumber.length === 10) {
      // YYMMDDXXXX -> YYMMDD-XXXX
      return `${cleanNumber.slice(0, 6)}-${cleanNumber.slice(6)}`;
    }

    return personalNumber;
  }

  /**
   * Check if a date is valid
   */
  private static isValidDate(year: number, month: number, day: number): boolean {
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
  }
}
