-- Add reserved_for_user_id to extra_slots to allow user-specific visibility
ALTER TABLE extra_slots
ADD COLUMN IF NOT EXISTS reserved_for_user_id uuid NULL REFERENCES users(id);

-- Backfill nothing; default is NULL meaning visible to all

