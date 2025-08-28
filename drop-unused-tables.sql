-- Script to drop unused tables from TrafikskolaX database
-- Run this script to clean up deprecated tables that are no longer needed
-- 
-- IMPORTANT: Make sure to backup your database before running this script!
-- 
-- Tables to keep for Teori system:
-- - teori_session_types (Groups for sessions with settings like allow supervisor)
-- - teori_sessions (Actual sessions with link to session types, price, participants)
-- - teori_bookings (Actual bookings for a session)
-- - teori_supervisors (Where handledare is stored for a session)
-- - invoices (Payment system)
-- - users (Student information)

-- Drop deprecated tables in correct order (considering foreign key constraints)

-- Drop booking-related tables first
DROP TABLE IF EXISTS booking_supervisor_details CASCADE;
DROP TABLE IF EXISTS session_bookings CASCADE;
DROP TABLE IF EXISTS handledar_bookings CASCADE;

-- Drop session-related tables
DROP TABLE IF EXISTS supervisor_details CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS handledar_sessions CASCADE;
DROP TABLE IF EXISTS session_types CASCADE;

-- Drop content management tables
DROP TABLE IF EXISTS page_images CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;

-- Drop messaging table
DROP TABLE IF EXISTS internal_messages CASCADE;

-- Verify remaining tables (these should still exist)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'teori_session_types',
    'teori_sessions', 
    'teori_bookings',
    'teori_supervisors',
    'invoices',
    'users'
  )
ORDER BY table_name;

-- Show all remaining tables to verify cleanup
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
