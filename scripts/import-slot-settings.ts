import { config } from 'dotenv';
import { resolve } from 'path';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

interface ExcelSlot {
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  isActive: boolean;
}

// Function to create dummy Excel file
async function createDummyExcel(outputPath: string = 'dummy-slot-settings.xlsx') {
  try {
    console.log('Creating dummy Excel file...');
    
    // Create dummy data for Monday to Sunday
    const dummyData = [
      // Monday (1)
      { dayOfWeek: 1, timeStart: '08:00', timeEnd: '09:00', isActive: true },
      { dayOfWeek: 1, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 1, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 1, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 1, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 1, timeStart: '14:00', timeEnd: '15:00', isActive: true },
      { dayOfWeek: 1, timeStart: '15:00', timeEnd: '16:00', isActive: true },
      { dayOfWeek: 1, timeStart: '16:00', timeEnd: '17:00', isActive: true },
      { dayOfWeek: 1, timeStart: '17:00', timeEnd: '18:00', isActive: true },
      { dayOfWeek: 1, timeStart: '18:00', timeEnd: '19:00', isActive: true },

      // Tuesday (2)
      { dayOfWeek: 2, timeStart: '08:00', timeEnd: '09:00', isActive: true },
      { dayOfWeek: 2, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 2, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 2, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 2, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 2, timeStart: '14:00', timeEnd: '15:00', isActive: true },
      { dayOfWeek: 2, timeStart: '15:00', timeEnd: '16:00', isActive: true },
      { dayOfWeek: 2, timeStart: '16:00', timeEnd: '17:00', isActive: true },
      { dayOfWeek: 2, timeStart: '17:00', timeEnd: '18:00', isActive: true },
      { dayOfWeek: 2, timeStart: '18:00', timeEnd: '19:00', isActive: true },

      // Wednesday (3)
      { dayOfWeek: 3, timeStart: '08:00', timeEnd: '09:00', isActive: true },
      { dayOfWeek: 3, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 3, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 3, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 3, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 3, timeStart: '14:00', timeEnd: '15:00', isActive: true },
      { dayOfWeek: 3, timeStart: '15:00', timeEnd: '16:00', isActive: true },
      { dayOfWeek: 3, timeStart: '16:00', timeEnd: '17:00', isActive: true },
      { dayOfWeek: 3, timeStart: '17:00', timeEnd: '18:00', isActive: true },
      { dayOfWeek: 3, timeStart: '18:00', timeEnd: '19:00', isActive: true },

      // Thursday (4)
      { dayOfWeek: 4, timeStart: '08:00', timeEnd: '09:00', isActive: true },
      { dayOfWeek: 4, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 4, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 4, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 4, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 4, timeStart: '14:00', timeEnd: '15:00', isActive: true },
      { dayOfWeek: 4, timeStart: '15:00', timeEnd: '16:00', isActive: true },
      { dayOfWeek: 4, timeStart: '16:00', timeEnd: '17:00', isActive: true },
      { dayOfWeek: 4, timeStart: '17:00', timeEnd: '18:00', isActive: true },
      { dayOfWeek: 4, timeStart: '18:00', timeEnd: '19:00', isActive: true },

      // Friday (5)
      { dayOfWeek: 5, timeStart: '08:00', timeEnd: '09:00', isActive: true },
      { dayOfWeek: 5, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 5, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 5, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 5, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 5, timeStart: '14:00', timeEnd: '15:00', isActive: true },
      { dayOfWeek: 5, timeStart: '15:00', timeEnd: '16:00', isActive: true },
      { dayOfWeek: 5, timeStart: '16:00', timeEnd: '17:00', isActive: true },
      { dayOfWeek: 5, timeStart: '17:00', timeEnd: '18:00', isActive: true },
      { dayOfWeek: 5, timeStart: '18:00', timeEnd: '19:00', isActive: true },

      // Saturday (6)
      { dayOfWeek: 6, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 6, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 6, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 6, timeStart: '12:00', timeEnd: '13:00', isActive: true },
      { dayOfWeek: 6, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 6, timeStart: '14:00', timeEnd: '15:00', isActive: true },

      // Sunday (0)
      { dayOfWeek: 0, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 0, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 0, timeStart: '12:00', timeEnd: '13:00', isActive: true },
      { dayOfWeek: 0, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 0, timeStart: '14:00', timeEnd: '15:00', isActive: true },
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dummyData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Slot Settings');

    // Write to file
    XLSX.writeFile(workbook, outputPath);
    console.log(`✅ Dummy Excel file created: ${outputPath}`);
    console.log('\nExcel file format:');
    console.log('- dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, etc.');
    console.log('- timeStart: Format HH:MM (e.g., "08:00")');
    console.log('- timeEnd: Format HH:MM (e.g., "09:00")');
    console.log('- isActive: true/false (optional, defaults to true)');

  } catch (error) {
    console.error('❌ Error creating dummy Excel file:', error);
    process.exit(1);
  }
}

async function importSlotSettings(excelFilePath: string, truncateFirst: boolean = false) {
  try {
    // Import database client only when needed for import
    const { db } = await import('../lib/db/client');
    const { slotSettings } = await import('../lib/db/schema');

    console.log('Starting slot settings import from Excel...');
    console.log(`Excel file: ${excelFilePath}`);
    console.log(`Truncate first: ${truncateFirst}`);

    // Read the Excel file
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`✓ Found ${jsonData.length} rows in Excel file`);

    // Validate and transform data
    const slots: ExcelSlot[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any;
      
      // Validate required fields
      if (!row.dayOfWeek || !row.timeStart || !row.timeEnd) {
        console.warn(`⚠️  Skipping row ${i + 1}: Missing required fields`);
        continue;
      }

      // Validate day of week (0-6, where 0=Sunday)
      const dayOfWeek = parseInt(row.dayOfWeek);
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        console.warn(`⚠️  Skipping row ${i + 1}: Invalid day of week (${row.dayOfWeek})`);
        continue;
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(row.timeStart) || !timeRegex.test(row.timeEnd)) {
        console.warn(`⚠️  Skipping row ${i + 1}: Invalid time format`);
        continue;
      }

      // Validate that end time is after start time
      if (row.timeStart >= row.timeEnd) {
        console.warn(`⚠️  Skipping row ${i + 1}: End time must be after start time`);
        continue;
      }

      slots.push({
        dayOfWeek,
        timeStart: row.timeStart,
        timeEnd: row.timeEnd,
        isActive: row.isActive !== false // Default to true if not specified
      });
    }

    console.log(`✓ Validated ${slots.length} slots from Excel`);

    // Truncate table if requested
    if (truncateFirst) {
      console.log('Truncating slot_settings table...');
      await db.delete(slotSettings);
      console.log('✓ Slot settings table truncated successfully');
    }

    // Insert new slots
    console.log('Inserting slots from Excel...');
    await db.insert(slotSettings).values(slots);
    console.log(`✓ Successfully inserted ${slots.length} slots`);

    // Verify the insertion
    const insertedSlots = await db.select().from(slotSettings).orderBy(slotSettings.dayOfWeek, slotSettings.timeStart);
    console.log(`✓ Verification: ${insertedSlots.length} slots found in database`);

    // Show summary by day
    const slotsByDay: Record<number, number> = {};
    insertedSlots.forEach(slot => {
      slotsByDay[slot.dayOfWeek] = (slotsByDay[slot.dayOfWeek] || 0) + 1;
    });

    console.log('\nSummary by day:');
    Object.entries(slotsByDay).forEach(([day, count]) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`  ${dayNames[parseInt(day)]}: ${count} slots`);
    });

    console.log('\n✅ Slot settings import completed successfully!');

  } catch (error) {
    console.error('❌ Error importing slot settings:', error);
    process.exit(1);
  }
}

// Main function to handle command line arguments
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'create-dummy') {
    const outputPath = args[1] || 'dummy-slot-settings.xlsx';
    await createDummyExcel(outputPath);
  } else if (command === 'import') {
    const excelFilePath = args[1];
    const truncateFirst = args.includes('--truncate');

    if (!excelFilePath) {
      console.error('❌ Please provide Excel file path');
      console.log('Usage: npx tsx scripts/import-slot-settings.ts import <excel-file> [--truncate]');
      process.exit(1);
    }

    await importSlotSettings(excelFilePath, truncateFirst);
  } else {
    console.log('Usage:');
    console.log('  Create dummy Excel: npx tsx scripts/import-slot-settings.ts create-dummy [output-file]');
    console.log('  Import from Excel: npx tsx scripts/import-slot-settings.ts import <excel-file> [--truncate]');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx scripts/import-slot-settings.ts create-dummy');
    console.log('  npx tsx scripts/import-slot-settings.ts import dummy-slot-settings.xlsx --truncate');
  }
}

// Run the script
main();
