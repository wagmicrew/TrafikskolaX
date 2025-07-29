-- Update users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS inskriven BOOLEAN DEFAULT false;

-- Update bookings table relations
DO $$
BEGIN
    ALTER TABLE IF EXISTS bookings
    ALTER COLUMN lesson_type_id SET NOT NULL,
    ADD CONSTRAINT fk_lesson_type FOREIGN KEY (lesson_type_id) REFERENCES lesson_types (id);
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table bookings or column lesson_type_id does not exist.';
END $$;

-- Re-add any missing checks on existing tables
DO $$
BEGIN
   ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'pending';
   ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'paid';
   ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'failed';
   ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refunded';
EXCEPTION
   WHEN duplicate_object THEN
      RAISE NOTICE 'Some payment statuses already exist.';
END $$;

