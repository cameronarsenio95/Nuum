/*
  # Fix Ad Sets Platform Constraint for Snapchat

  1. Changes
    - Drop the existing platform check constraint
    - Add new constraint that allows Snapchat instead of YouTube
    - Ensure all platform values are: META, TikTok, Google, Snapchat, Other

  2. Security
    - No changes to RLS policies
*/

-- Drop the existing constraint
ALTER TABLE ad_sets DROP CONSTRAINT IF EXISTS ad_sets_platform_check;

-- Add the new constraint with Snapchat instead of YouTube
ALTER TABLE ad_sets ADD CONSTRAINT ad_sets_platform_check 
  CHECK (platform = ANY (ARRAY['META'::text, 'TikTok'::text, 'Google'::text, 'Snapchat'::text, 'Other'::text]));
