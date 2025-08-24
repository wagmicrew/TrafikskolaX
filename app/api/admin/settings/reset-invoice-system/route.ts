import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();

      // Drop tables in correct order (due to foreign key constraints)
      await client.query(`DROP TABLE IF EXISTS invoice_items CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS invoices CASCADE;`);

      // Drop sequence
      await client.query(`DROP SEQUENCE IF EXISTS invoice_number_seq;`);

      // Drop function
      await client.query(`DROP FUNCTION IF EXISTS generate_invoice_number();`);

      // Drop enum types
      await client.query(`DROP TYPE IF EXISTS invoice_status CASCADE;`);
      await client.query(`DROP TYPE IF EXISTS invoice_type CASCADE;`);
      await client.query(`DROP TYPE IF EXISTS payment_method CASCADE;`);

      return NextResponse.json({
        message: 'Faktura systemet har återställts framgångsrikt!',
        status: 'reset_success'
      });

    } catch (error) {
      console.error('Error resetting invoice system:', error);
      return NextResponse.json({
        error: 'Fel vid återställning av faktura system'
      }, { status: 500 });
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error('Error in reset-invoice-system:', error);
    return NextResponse.json({ error: 'Internt serverfel' }, { status: 500 });
  }
}
