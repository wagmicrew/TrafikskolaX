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

      // Check if invoice system is already initialized
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'invoices'
        ) as exists
      `);

      if (checkResult.rows[0].exists) {
        return NextResponse.json({
          message: 'Faktura systemet är redan initierat',
          status: 'already_exists'
        });
      }

      // Create enum types
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'error');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await client.query(`
        DO $$ BEGIN
          CREATE TYPE invoice_type AS ENUM ('booking', 'handledar', 'package', 'custom');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await client.query(`
        DO $$ BEGIN
          CREATE TYPE payment_method AS ENUM ('swish', 'qliro', 'credits', 'cash', 'bank_transfer');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create invoices table
      await client.query(`
        CREATE TABLE IF NOT EXISTS invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoice_number VARCHAR(100) NOT NULL UNIQUE,
          type invoice_type NOT NULL,
          customer_id UUID REFERENCES users(id),
          customer_email VARCHAR(255),
          customer_name VARCHAR(255),
          customer_phone VARCHAR(50),
          description TEXT,
          amount DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'SEK',
          status invoice_status DEFAULT 'pending',
          payment_method payment_method,
          swish_uuid VARCHAR(255),
          qliro_order_id VARCHAR(255),
          payment_reference VARCHAR(255),
          booking_id UUID,
          session_id UUID,
          handledar_booking_id UUID,
          package_id UUID,
          issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          due_date TIMESTAMP WITH TIME ZONE,
          paid_at TIMESTAMP WITH TIME ZONE,
          last_reminder_sent TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          internal_notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          reminder_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);

      // Create invoice_items table
      await client.query(`
        CREATE TABLE IF NOT EXISTS invoice_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
          description TEXT NOT NULL,
          quantity INTEGER DEFAULT 1,
          unit_price DECIMAL(10, 2) NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          item_type VARCHAR(50),
          item_reference UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);

      // Create indexes
      await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON invoices(issued_at);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);`);

      // Create invoice number sequence
      await client.query(`CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;`);

      // Create invoice number generation function
      await client.query(`
        CREATE OR REPLACE FUNCTION generate_invoice_number()
        RETURNS TEXT AS $$
        BEGIN
          RETURN 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
        END;
        $$ LANGUAGE plpgsql;
      `);

      return NextResponse.json({
        message: 'Faktura systemet har initierats framgångsrikt!',
        status: 'success'
      });

    } catch (error) {
      console.error('Error initializing invoice system:', error);
      return NextResponse.json({
        error: 'Fel vid initiering av faktura system'
      }, { status: 500 });
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error('Error in init-invoice-system:', error);
    return NextResponse.json({ error: 'Internt serverfel' }, { status: 500 });
  }
}
