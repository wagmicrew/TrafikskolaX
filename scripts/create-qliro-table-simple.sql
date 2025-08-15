-- Simple approach: Create table without foreign keys first
DROP TABLE IF EXISTS "qliro_orders" CASCADE;

-- Create basic table structure
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
);
