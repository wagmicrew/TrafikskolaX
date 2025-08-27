-- Check for blocked slots in the database
-- Run this in your database to see what slots are blocked

SELECT
    id,
    date,
    time_start,
    time_end,
    is_all_day,
    reason,
    created_at
FROM blocked_slots
ORDER BY date, time_start;

-- Count blocked slots by date
SELECT
    date,
    COUNT(*) as blocked_count,
    GROUP_CONCAT(
        CASE
            WHEN is_all_day THEN 'All Day'
            ELSE CONCAT(time_start, '-', time_end)
        END
        ORDER BY time_start
    ) as blocked_times
FROM blocked_slots
GROUP BY date
ORDER BY date;
