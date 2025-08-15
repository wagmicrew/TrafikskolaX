-- Manual fix for qliro_orders table
-- First, drop the table if it exists (to clean up any partial creation)
DROP TABLE IF EXISTS "qliro_orders" CASCADE;

-- Create the table with all constraints inline to avoid issues
CREATE TABLE "qliro_orders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "booking_id" uuid REFERENCES "bookings"("id") ON DELETE CASCADE,
    "handledar_booking_id" uuid REFERENCES "handledar_bookings"("id") ON DELETE CASCADE,
    "package_purchase_id" uuid REFERENCES "package_purchases"("id") ON DELETE CASCADE,
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
);

-- Create indexes
CREATE INDEX "qliro_orders_booking_id_idx" ON "qliro_orders" ("booking_id");
CREATE INDEX "qliro_orders_handledar_booking_id_idx" ON "qliro_orders" ("handledar_booking_id");
CREATE INDEX "qliro_orders_package_purchase_id_idx" ON "qliro_orders" ("package_purchase_id");
CREATE INDEX "qliro_orders_status_idx" ON "qliro_orders" ("status");
CREATE INDEX "qliro_orders_environment_idx" ON "qliro_orders" ("environment");

-- Verify the table was created
SELECT 'Table created successfully' as status;
