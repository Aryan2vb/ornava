-- Allow larger shop logo sizing after trimming transparent logo padding.

ALTER TABLE user_logo_settings
  DROP CONSTRAINT IF EXISTS user_logo_settings_size_percent_check;

ALTER TABLE user_logo_settings
  ADD CONSTRAINT user_logo_settings_size_percent_check
  CHECK (size_percent BETWEEN 8 AND 40);
