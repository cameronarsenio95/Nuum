/*
  # Update Theme Preference Default Value

  1. Changes
    - Update the default value for `theme_preference` column in `profiles` table
    - Change from 'dark' to 'system' to support new theme modes (light, dark, system)
  
  2. Notes
    - Existing user preferences will not be affected
    - New users will default to 'system' theme which respects OS preferences
*/

ALTER TABLE profiles 
ALTER COLUMN theme_preference SET DEFAULT 'system';
