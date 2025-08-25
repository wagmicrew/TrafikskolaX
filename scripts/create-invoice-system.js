const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createInvoiceSystem() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('📋 Creating invoice system tables...');

    // Create enum types
    console.log('🔧 Creating enum types...');
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
    console.log('📄 Creating invoices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(100) NOT NULL UNIQUE,
        type invoice_type NOT NULL,

        -- Customer information
        customer_id UUID REFERENCES users(id),
        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),

        -- Invoice details
        description TEXT,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'SEK',
        status invoice_status DEFAULT 'pending',

        -- Payment information
        payment_method payment_method,
        swish_uuid VARCHAR(255),
        qliro_order_id VARCHAR(255),
        payment_reference VARCHAR(255),

        -- Related entities
        booking_id UUID,
        session_id UUID,
        handledar_booking_id UUID,
        package_id UUID,

        -- Dates
        issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        due_date TIMESTAMP WITH TIME ZONE,
        paid_at TIMESTAMP WITH TIME ZONE,
        last_reminder_sent TIMESTAMP WITH TIME ZONE,

        -- Additional fields
        notes TEXT,
        internal_notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        reminder_count INTEGER DEFAULT 0,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Create invoice_items table
    console.log('📝 Creating invoice_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

        description TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,

        -- Optional reference to what this item represents
        item_type VARCHAR(50),
        item_reference UUID,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Create indexes
    console.log('🔍 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON invoices(issued_at);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
    `);

    // Create invoice number sequence
    console.log('🔢 Setting up invoice number sequence...');
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;
    `);

    // Create a function to generate invoice numbers
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_invoice_number()
      RETURNS TEXT AS $$
      BEGIN
        RETURN 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Invoice system created successfully!');

    // Generate some sample invoice numbers to test
    const testNumbers = await client.query(`
      SELECT generate_invoice_number() as invoice_number
      FROM generate_series(1, 5);
    `);

    console.log('📋 Sample invoice numbers:', testNumbers.rows.map(r => r.invoice_number));

  } catch (error) {
    console.error('❌ Error creating invoice system:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

createInvoiceSystem();
