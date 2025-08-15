-- Migration 3: Add indexes to qliro_orders table
CREATE INDEX IF NOT EXISTS "qliro_orders_booking_id_idx" ON "qliro_orders" ("booking_id");
CREATE INDEX IF NOT EXISTS "qliro_orders_handledar_booking_id_idx" ON "qliro_orders" ("handledar_booking_id");
CREATE INDEX IF NOT EXISTS "qliro_orders_package_purchase_id_idx" ON "qliro_orders" ("package_purchase_id");
CREATE INDEX IF NOT EXISTS "qliro_orders_status_idx" ON "qliro_orders" ("status");
CREATE INDEX IF NOT EXISTS "qliro_orders_environment_idx" ON "qliro_orders" ("environment");
