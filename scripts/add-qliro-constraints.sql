-- Add foreign key constraints separately (run after table creation)
ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_booking_id_fk" 
FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE;

ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_handledar_booking_id_fk" 
FOREIGN KEY ("handledar_booking_id") REFERENCES "handledar_bookings"("id") ON DELETE CASCADE;

ALTER TABLE "qliro_orders" ADD CONSTRAINT "qliro_orders_package_purchase_id_fk" 
FOREIGN KEY ("package_purchase_id") REFERENCES "package_purchases"("id") ON DELETE CASCADE;
