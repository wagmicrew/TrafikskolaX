const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function createQliroOrdersTable() {
  const client = await pool.connect();
  
  try {
    console.log('Dropping existing qliro_orders table if it exists...');
    await client.query('DROP TABLE IF EXISTS "qliro_orders"');
    
    console.log('Creating qliro_orders table...');
    await client.query(`
      CREATE TABLE "qliro_orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "booking_id" uuid,
        "handledar_booking_id" uuid,
        "package_purchase_id" uuid,
        "qliro_order_id" varchar(255) NOT NULL,
        "merchant_reference" varchar(255) NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "currency" varchar(3) DEFAULT 'SEK',
        "status" varchar(50) DEFAULT 'created',
        "payment_link" text,
        "last_status_check" timestamp,
        "environment" varchar(20) DEFAULT 'sandbox',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "qliro_orders_qliro_order_id_unique" UNIQUE("qliro_order_id")
      )
    `);
    
    console.log('Adding foreign key constraints...');
    await client.query(`
      ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_booking_id_bookings_id_fk" 
      FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE cascade ON UPDATE no action
    `);
    
    await client.query(`
      ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_handledar_booking_id_handledar_bookings_id_fk" 
      FOREIGN KEY ("handledar_booking_id") REFERENCES "handledar_bookings"("id") ON DELETE cascade ON UPDATE no action
    `);
    
    await client.query(`
      ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_package_purchase_id_package_purchases_id_fk" 
      FOREIGN KEY ("package_purchase_id") REFERENCES "package_purchases"("id") ON DELETE cascade ON UPDATE no action
    `);
    
    console.log('Creating indexes...');
    await client.query('CREATE INDEX "qliro_orders_booking_id_idx" ON "qliro_orders" ("booking_id")');
    await client.query('CREATE INDEX "qliro_orders_handledar_booking_id_idx" ON "qliro_orders" ("handledar_booking_id")');
    await client.query('CREATE INDEX "qliro_orders_package_purchase_id_idx" ON "qliro_orders" ("package_purchase_id")');
    await client.query('CREATE INDEX "qliro_orders_status_idx" ON "qliro_orders" ("status")');
    await client.query('CREATE INDEX "qliro_orders_environment_idx" ON "qliro_orders" ("environment")');
    
    console.log('Verifying table structure...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'qliro_orders' 
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    console.log('\n✅ qliro_orders table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating qliro_orders table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createQliroOrdersTable().catch(console.error);
