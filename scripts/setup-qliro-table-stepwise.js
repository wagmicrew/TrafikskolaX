const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require');

async function setupQliroTable() {
  try {
    console.log('Step 1: Dropping existing table if it exists...');
    await sql`DROP TABLE IF EXISTS "qliro_orders" CASCADE`;
    console.log('✅ Table dropped');

    console.log('Step 2: Creating basic table structure...');
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
    console.log('✅ Basic table created');

    console.log('Step 3: Adding foreign key constraints...');
    try {
      await sql`
        ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_booking_id_fk" 
        FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE
      `;
      console.log('✅ Booking foreign key added');
    } catch (e) {
      console.log('⚠️ Booking foreign key failed:', e.message);
    }

    try {
      await sql`
        ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_handledar_booking_id_fk" 
        FOREIGN KEY ("handledar_booking_id") REFERENCES "handledar_bookings"("id") ON DELETE CASCADE
      `;
      console.log('✅ Handledar booking foreign key added');
    } catch (e) {
      console.log('⚠️ Handledar booking foreign key failed:', e.message);
    }

    try {
      await sql`
        ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_package_purchase_id_fk" 
        FOREIGN KEY ("package_purchase_id") REFERENCES "package_purchases"("id") ON DELETE CASCADE
      `;
      console.log('✅ Package purchase foreign key added');
    } catch (e) {
      console.log('⚠️ Package purchase foreign key failed:', e.message);
    }

    console.log('Step 4: Creating indexes...');
    const indexes = [
      { name: 'qliro_orders_booking_id_idx', column: 'booking_id' },
      { name: 'qliro_orders_handledar_booking_id_idx', column: 'handledar_booking_id' },
      { name: 'qliro_orders_package_purchase_id_idx', column: 'package_purchase_id' },
      { name: 'qliro_orders_status_idx', column: 'status' },
      { name: 'qliro_orders_environment_idx', column: 'environment' }
    ];

    for (const index of indexes) {
      try {
        await sql`CREATE INDEX ${sql(index.name)} ON "qliro_orders" (${sql(index.column)})`;
        console.log(`✅ Index ${index.name} created`);
      } catch (e) {
        console.log(`⚠️ Index ${index.name} failed:`, e.message);
      }
    }

    console.log('Step 5: Verifying table structure...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'qliro_orders' 
      ORDER BY ordinal_position
    `;

    console.log('Table structure:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n🎉 Qliro orders table setup completed!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

setupQliroTable().catch(console.error);
