const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require');
const db = drizzle(sql);

async function verifyAndCreateTable() {
  try {
    // Check if table exists
    console.log('Checking if qliro_orders table exists...');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'qliro_orders'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log('✅ qliro_orders table already exists');
      
      // Check columns
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'qliro_orders' 
        ORDER BY ordinal_position;
      `;
      
      console.log('Table columns:');
      columns.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
      
      return;
    }
    
    console.log('Table does not exist, creating...');
    
    // Create table
    await sql`
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
    `;
    
    // Add foreign keys
    await sql`
      ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_booking_id_bookings_id_fk" 
      FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE cascade
    `;
    
    await sql`
      ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_handledar_booking_id_handledar_bookings_id_fk" 
      FOREIGN KEY ("handledar_booking_id") REFERENCES "handledar_bookings"("id") ON DELETE cascade
    `;
    
    await sql`
      ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_package_purchase_id_package_purchases_id_fk" 
      FOREIGN KEY ("package_purchase_id") REFERENCES "package_purchases"("id") ON DELETE cascade
    `;
    
    // Create indexes
    await sql`CREATE INDEX "qliro_orders_booking_id_idx" ON "qliro_orders" ("booking_id")`;
    await sql`CREATE INDEX "qliro_orders_handledar_booking_id_idx" ON "qliro_orders" ("handledar_booking_id")`;
    await sql`CREATE INDEX "qliro_orders_package_purchase_id_idx" ON "qliro_orders" ("package_purchase_id")`;
    await sql`CREATE INDEX "qliro_orders_status_idx" ON "qliro_orders" ("status")`;
    await sql`CREATE INDEX "qliro_orders_environment_idx" ON "qliro_orders" ("environment")`;
    
    console.log('✅ qliro_orders table created successfully with all constraints and indexes!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyAndCreateTable();
