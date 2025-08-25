import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Save PDF buffer to local storage
 * @param pdfBuffer - The PDF buffer to save
 * @param fileName - The filename for the PDF
 * @returns Promise<string> - The file path where the PDF was saved
 */
export async function savePDFToStorage(pdfBuffer: Buffer, fileName: string): Promise<string> {
  try {
    // Create pdfs directory if it doesn't exist
    const pdfDir = join(process.cwd(), 'public', 'pdfs');
    if (!existsSync(pdfDir)) {
      await mkdir(pdfDir, { recursive: true });
    }

    // Create full file path
    const filePath = join(pdfDir, fileName);
    
    // Write the PDF buffer to file
    await writeFile(filePath, pdfBuffer);
    
    // Return the relative path for web access
    return `/pdfs/${fileName}`;
  } catch (error) {
    console.error('Error saving PDF to storage:', error);
    throw new Error('Failed to save PDF to storage');
  }
}

/**
 * Generate a unique filename for user deletion PDF
 * @param userId - The user ID
 * @param userName - The user's full name
 * @returns string - A unique filename
 */
export function generatePDFFileName(userId: string, userName: string): string {
  const timestamp = Date.now();
  const sanitizedName = userName.replace(/[^a-zA-Z0-9åäöÅÄÖ\s]/g, '').replace(/\s+/g, '_');
  return `user_deletion_${sanitizedName}_${userId.substring(0, 8)}_${timestamp}.pdf`;
}
