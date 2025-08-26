#!/usr/bin/env node

/**
 * Migration: Add type column to lesson_types table
 *
 * This adds the missing 'type' column that the unified Teori system expects
 */

require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function addTypeColumn() {
  console.log('🔄 Adding type column to lesson_types table...');

  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not set!');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Add the type column if it doesn't exist
    await sql`ALTER TABLE lesson_types ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'driving'`;

    // Update existing records to have appropriate types based on names
    await sql`
      UPDATE lesson_types
      SET type = CASE
        WHEN name ILIKE '%teori%' OR name ILIKE '%theory%' THEN 'theory'
        WHEN name ILIKE '%handledar%' OR name ILIKE '%supervisor%' THEN 'supervisor'
        WHEN name ILIKE '%assessment%' OR name ILIKE '%prov%' THEN 'assessment'
        ELSE 'driving'
      END
      WHERE type IS NULL OR type = 'driving'
    `;

    console.log('✅ Added type column to lesson_types table');
    console.log('📋 Updated existing records with appropriate types');

    // Verify the changes
    const result = await sql`SELECT id, name, type FROM lesson_types WHERE is_active = true LIMIT 10`;
    console.log('\n📋 Verification - lesson_types with type column:');
    result.forEach(lt => {
      console.log(`   • ${lt.name} → ${lt.type}`);
    });

  } catch (error) {
    console.error('❌ Error adding type column:', error.message);
  }
}

addTypeColumn();
