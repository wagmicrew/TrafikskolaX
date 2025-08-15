import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function fixQliroOrdersTable() {
  try {
    console.log('Dropping existing qliro_orders table if it exists...');
    await db.execute(sql`DROP TABLE IF EXISTS "qliro_orders"`);
    
    console.log('Creating qliro_orders table...');
    await db.execute(sql`
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
    await db.execute(sql`
      ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_booking_id_bookings_id_fk" 
      FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE cascade ON UPDATE no action
    `);
    
    await db.execute(sql`
      ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_handledar_booking_id_handledar_bookings_id_fk" 
      FOREIGN KEY ("handledar_booking_id") REFERENCES "handledar_bookings"("id") ON DELETE cascade ON UPDATE no action
    `);
    
    await db.execute(sql`
      ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_package_purchase_id_package_purchases_id_fk" 
      FOREIGN KEY ("package_purchase_id") REFERENCES "package_purchases"("id") ON DELETE cascade ON UPDATE no action
    `);
    
    console.log('Creating indexes...');
    await db.execute(sql`CREATE INDEX "qliro_orders_booking_id_idx" ON "qliro_orders" ("booking_id")`);
    await db.execute(sql`CREATE INDEX "qliro_orders_handledar_booking_id_idx" ON "qliro_orders" ("handledar_booking_id")`);
    await db.execute(sql`CREATE INDEX "qliro_orders_package_purchase_id_idx" ON "qliro_orders" ("package_purchase_id")`);
    await db.execute(sql`CREATE INDEX "qliro_orders_status_idx" ON "qliro_orders" ("status")`);
    await db.execute(sql`CREATE INDEX "qliro_orders_environment_idx" ON "qliro_orders" ("environment")`);
    
    console.log('✅ qliro_orders table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating qliro_orders table:', error);
    throw error;
  }
}

fixQliroOrdersTable().catch(console.error);
