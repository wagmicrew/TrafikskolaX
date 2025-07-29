-- Add swish_uuid column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS swish_uuid VARCHAR(255);

-- Create index on swish_uuid for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_swish_uuid ON bookings(swish_uuid);
