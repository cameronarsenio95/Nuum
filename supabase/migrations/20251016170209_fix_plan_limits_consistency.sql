/*
  # Fix Plan Limits Consistency
  
  ## Overview
  This migration corrects inconsistencies between the database plan limits and what is shown on the pricing page and enforced in the frontend.
  
  ## Changes Made
  
  ### 1. Updated Plan Limits
  **Standard Plan:**
  - Creators: 50 → 25
  - Storage: 10GB → 5GB
  - Team members: 3 (unchanged)
  
  **Elite Plan:**
  - Creators: unlimited → 50
  - Storage: 100GB → 25GB
  - Team members: 10 → 5
  
  ### 2. Updated Features
  **Trial (7-day):**
  - Now has Elite features instead of Standard features
  - Gives users full feature access during trial period
  
  **Standard Plan:**
  - Confirmed to have revenue_tracking feature
  
  ### 3. Updated subscription_features Table
  - Corrected feature descriptions to match actual limits
  - Updated all plan feature records with accurate information
  
  ## Security
  - No RLS policy changes
  - Only updates metadata and limits
*/

-- Update Standard plan limits for existing workspaces
UPDATE workspaces
SET 
  max_creators = 25,
  max_storage_gb = 5,
  max_team_members = 3
WHERE plan = 'standard';

-- Update Elite plan limits for existing workspaces
UPDATE workspaces
SET 
  max_creators = 50,
  max_storage_gb = 25,
  max_team_members = 5
WHERE plan = 'elite';

-- Update subscription_features descriptions to match actual limits
UPDATE subscription_features
SET feature_description = 'Manage up to 25 creators'
WHERE plan_name = 'standard' AND feature_key = 'creator_management';

UPDATE subscription_features
SET feature_description = '5GB storage for media files'
WHERE plan_name = 'standard' AND feature_key = 'content_library';

UPDATE subscription_features
SET feature_description = 'Up to 3 team members'
WHERE plan_name = 'standard' AND feature_key = 'team_collaboration';

UPDATE subscription_features
SET feature_description = 'Manage up to 50 creators'
WHERE plan_name = 'elite' AND feature_key = 'creator_management';

UPDATE subscription_features
SET feature_description = '25GB storage for media files'
WHERE plan_name = 'elite' AND feature_key = 'content_library';

UPDATE subscription_features
SET feature_description = 'Up to 5 team members'
WHERE plan_name = 'elite' AND feature_key = 'team_collaboration';

-- Update default limits in migration for future workspaces
COMMENT ON COLUMN workspaces.max_creators IS 'Max creators per plan: free=10, standard=25, elite=50, enterprise=unlimited(null)';
COMMENT ON COLUMN workspaces.max_storage_gb IS 'Max storage per plan: free=1, standard=5, elite=25, enterprise=unlimited(null)';
COMMENT ON COLUMN workspaces.max_team_members IS 'Max team members per plan: free=1, standard=3, elite=5, enterprise=unlimited(null)';
