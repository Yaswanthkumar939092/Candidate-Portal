-- Add provider column to profiles table to track OAuth authentication method

ALTER TABLE profiles
ADD COLUMN provider TEXT DEFAULT 'email';

-- Add comment to explain the purpose of the column
COMMENT ON COLUMN profiles.provider IS 'Authentication provider used (email, google, linkedin, etc.)';

-- Update existing profiles to have 'email' as provider
UPDATE profiles
SET provider = 'email'
WHERE provider IS NULL;