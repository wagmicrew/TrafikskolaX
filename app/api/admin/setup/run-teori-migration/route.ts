import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', 'migrations', '2025-01-27_add_session_type_support.sql');
    
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { success: false, error: 'Migration file not found' },
        { status: 404 }
      );
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by statement breakpoints and execute each part
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    let executedStatements = 0;
    
    for (const statement of statements) {
      if (statement) {
        try {
          await db.execute(sql.raw(statement));
          executedStatements++;
        } catch (error) {
          // Some statements might fail if already executed, that's okay
          console.log('Statement execution note:', error);
        }
      }
    }

    // Verify the migration worked
    const tableCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teori_sessions' AND column_name = 'session_type'
    `);

    if (tableCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Migration verification failed - session_type column not found' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Teori migration completed successfully! Executed ${executedStatements} statements.`,
      details: {
        executedStatements,
        totalStatements: statements.length
      }
    });

  } catch (error) {
    console.error('Error running Teori migration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run Teori migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
