const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require');

async function checkTable() {
  try {
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'qliro_orders'
      );
    `;
    
    if (!tableExists[0].exists) {
      console.log('❌ Table does not exist, creating it...');
      
      // Create the table
      await sql`
        CREATE TABLE "qliro_orders" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "booking_id" uuid,
          "handledar_booking_id" uuid,
          "package_purchase_id" uuid,
          "qliro_order_id" varchar(255) NOT NULL UNIQUE,
          "merchant_reference" varchar(255) NOT NULL,
          "amount" numeric(10, 2) NOT NULL,
          "currency" varchar(3) DEFAULT 'SEK',
          "status" varchar(50) DEFAULT 'created',
          "payment_link" text,
          "last_status_check" timestamp,
          "environment" varchar(20) DEFAULT 'sandbox',
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        )
      `;
      console.log('✅ Table created successfully');
    } else {
      console.log('✅ Table already exists');
    }
    
    // Show table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'qliro_orders' 
      ORDER BY ordinal_position
    `;
    
    console.log('\nTable structure:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n🎉 Qliro orders table is ready!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTable();
