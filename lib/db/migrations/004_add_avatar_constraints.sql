-- Ensure proper constraints for profile image URLs
ALTER TABLE users ALTER COLUMN profile_image TYPE TEXT;

-- You can add any additional migration scripts related to avatar images here.

