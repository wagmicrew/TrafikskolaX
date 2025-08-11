-- Suggested indexes to improve common queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON bookings (status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits (user_id);
CREATE INDEX IF NOT EXISTS idx_package_purchases_user_id ON package_purchases (user_id);

