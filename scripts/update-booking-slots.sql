-- Update Booking Slots Script
-- This script will:
-- 1. Truncate all current bookings
-- 2. Truncate all current slot settings
-- 3. Insert new slot settings based on the provided schedule

-- Start transaction
BEGIN;

-- 1. Truncate all current bookings
-- Using DELETE instead of TRUNCATE to maintain foreign key constraints
DELETE FROM bookings;

-- 2. Truncate all current slot settings
DELETE FROM slot_settings;

-- 3. Truncate blocked slots (optional - uncomment if needed)
-- DELETE FROM blocked_slots;

-- 4. Insert new slot settings
-- Based on the image schedule: Daily slots from early morning to late afternoon
-- Assuming the schedule runs Monday to Friday (1-5)

-- Monday slots
INSERT INTO slot_settings (day_of_week, time_start, time_end, is_active, admin_minutes) VALUES
(1, '06:00:00', '07:45:00', true, 0),
(1, '08:00:00', '09:45:00', true, 0),
(1, '10:00:00', '11:45:00', true, 0),
(1, '12:00:00', '13:45:00', true, 0),
(1, '14:00:00', '15:45:00', true, 0),
(1, '16:00:00', '17:45:00', true, 0);

-- Tuesday slots
INSERT INTO slot_settings (day_of_week, time_start, time_end, is_active, admin_minutes) VALUES
(2, '06:00:00', '07:45:00', true, 0),
(2, '08:00:00', '09:45:00', true, 0),
(2, '10:00:00', '11:45:00', true, 0),
(2, '12:00:00', '13:45:00', true, 0),
(2, '14:00:00', '15:45:00', true, 0),
(2, '16:00:00', '17:45:00', true, 0);

-- Wednesday slots
INSERT INTO slot_settings (day_of_week, time_start, time_end, is_active, admin_minutes) VALUES
(3, '06:00:00', '07:45:00', true, 0),
(3, '08:00:00', '09:45:00', true, 0),
(3, '10:00:00', '11:45:00', true, 0),
(3, '12:00:00', '13:45:00', true, 0),
(3, '14:00:00', '15:45:00', true, 0),
(3, '16:00:00', '17:45:00', true, 0);

-- Thursday slots
INSERT INTO slot_settings (day_of_week, time_start, time_end, is_active, admin_minutes) VALUES
(4, '06:00:00', '07:45:00', true, 0),
(4, '08:00:00', '09:45:00', true, 0),
(4, '10:00:00', '11:45:00', true, 0),
(4, '12:00:00', '13:45:00', true, 0),
(4, '14:00:00', '15:45:00', true, 0),
(4, '16:00:00', '17:45:00', true, 0);

-- Friday slots
INSERT INTO slot_settings (day_of_week, time_start, time_end, is_active, admin_minutes) VALUES
(5, '06:00:00', '07:45:00', true, 0),
(5, '08:00:00', '09:45:00', true, 0),
(5, '10:00:00', '11:45:00', true, 0),
(5, '12:00:00', '13:45:00', true, 0),
(5, '14:00:00', '15:45:00', true, 0),
(5, '16:00:00', '17:45:00', true, 0);

-- Optional: Add weekend slots (Saturday and Sunday) if needed
-- Uncomment the following lines to add weekend slots

-- Saturday slots (reduced hours)
-- INSERT INTO slot_settings (day_of_week, time_start, time_end, is_active, admin_minutes) VALUES
-- (6, '08:00:00', '09:45:00', true, 0),
-- (6, '10:00:00', '11:45:00', true, 0),
-- (6, '12:00:00', '13:45:00', true, 0);

-- Sunday slots (closed)
-- No slots for Sunday (day_of_week = 0)

-- Commit transaction
COMMIT;

-- Verify the changes
SELECT 
    day_of_week,
    time_start,
    time_end,
    is_active,
    CASE day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name
FROM slot_settings
ORDER BY day_of_week, time_start;
