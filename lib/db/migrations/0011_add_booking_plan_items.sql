-- Booking plan items: stores planned step identifiers per booking
CREATE TABLE IF NOT EXISTS booking_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  step_identifier VARCHAR(50) NOT NULL,
  added_by UUID REFERENCES users(id),
  is_selected BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure uniqueness per booking/step
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_plan_items_unique
ON booking_plan_items(booking_id, step_identifier);


