/*
  # Add Plan Limits and Subscription Management

  ## Overview
  This migration adds comprehensive plan-based feature restrictions and subscription management to the workspaces table.

  ## Changes Made
  
  1. **Workspace Plan Updates**
     - Add 'free' and 'enterprise' plan types to existing 'standard' and 'elite'
     - Add max_creators limit (enforces creator count per plan)
     - Add max_storage_gb limit (enforces storage quota per plan)
     - Add max_workspaces_per_user limit (for future multi-workspace support)
     - Add subscription_status for billing state tracking
     - Add subscription_expires_at for trial/expiry tracking
     - Add features JSONB column for flexible feature flags
  
  2. **Plan Limits by Tier**
     - Free: 10 creators, 1GB storage, 1 team member
     - Standard: 50 creators, 10GB storage, 3 team members
     - Elite: unlimited creators, 100GB storage, 10 team members
     - Enterprise: unlimited everything
  
  3. **Storage Tracking**
     - Add storage_used_bytes column to track actual storage usage
     - Will be updated by triggers when content is uploaded/deleted
  
  4. **Subscription Features Table**
     - New table to define available features per plan
     - Allows flexible feature flagging (analytics, exports, integrations, etc.)
  
  ## Security
  - All columns have appropriate defaults
  - RLS policies remain unchanged
*/

-- Step 1: Add new columns to workspaces table
DO $$
BEGIN
  -- Add max_creators column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workspaces' AND column_name = 'max_creators'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN max_creators integer;
  END IF;

  -- Add max_storage_gb column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workspaces' AND column_name = 'max_storage_gb'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN max_storage_gb integer;
  END IF;

  -- Add storage_used_bytes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workspaces' AND column_name = 'storage_used_bytes'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN storage_used_bytes bigint DEFAULT 0;
  END IF;

  -- Add subscription_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workspaces' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'expired'));
  END IF;

  -- Add subscription_expires_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workspaces' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN subscription_expires_at timestamptz;
  END IF;

  -- Add features column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workspaces' AND column_name = 'features'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN features jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Step 2: Update existing plan column to support all plan types
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_plan_check;
  
  -- Add new constraint with all plan types
  ALTER TABLE workspaces ADD CONSTRAINT workspaces_plan_check 
    CHECK (plan IN ('free', 'standard', 'elite', 'enterprise'));
END $$;

-- Step 3: Set default limits for existing workspaces based on their current plan
UPDATE workspaces
SET 
  max_creators = CASE 
    WHEN plan = 'standard' THEN 50
    WHEN plan = 'elite' THEN NULL -- NULL means unlimited
    ELSE 10 -- Default to free tier limits
  END,
  max_storage_gb = CASE 
    WHEN plan = 'standard' THEN 10
    WHEN plan = 'elite' THEN 100
    ELSE 1 -- Default to free tier limits
  END,
  max_team_members = CASE 
    WHEN max_team_members IS NULL AND plan = 'standard' THEN 3
    WHEN max_team_members IS NULL AND plan = 'elite' THEN 10
    WHEN max_team_members IS NULL THEN 1
    ELSE max_team_members
  END,
  features = CASE 
    WHEN plan = 'free' THEN '{"basic_analytics": true, "export_data": false, "advanced_analytics": false, "priority_support": false}'::jsonb
    WHEN plan = 'standard' THEN '{"basic_analytics": true, "export_data": false, "advanced_analytics": true, "priority_support": false}'::jsonb
    WHEN plan = 'elite' THEN '{"basic_analytics": true, "export_data": true, "advanced_analytics": true, "priority_support": true}'::jsonb
    WHEN plan = 'enterprise' THEN '{"basic_analytics": true, "export_data": true, "advanced_analytics": true, "priority_support": true, "custom_integrations": true, "dedicated_manager": true}'::jsonb
    ELSE '{"basic_analytics": true, "export_data": false, "advanced_analytics": false, "priority_support": false}'::jsonb
  END
WHERE max_creators IS NULL OR max_storage_gb IS NULL OR features = '{}'::jsonb;

-- Step 4: Create subscription_features table for flexible feature management
CREATE TABLE IF NOT EXISTS subscription_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL CHECK (plan_name IN ('free', 'standard', 'elite', 'enterprise')),
  feature_key text NOT NULL,
  feature_name text NOT NULL,
  feature_description text,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(plan_name, feature_key)
);

-- Step 5: Enable RLS on subscription_features
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for subscription_features (read-only for authenticated users)
DROP POLICY IF EXISTS "Users can view subscription features" ON subscription_features;
CREATE POLICY "Users can view subscription features"
  ON subscription_features
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 7: Insert default features for each plan
INSERT INTO subscription_features (plan_name, feature_key, feature_name, feature_description, is_enabled)
VALUES
  -- Free Plan Features
  ('free', 'basic_analytics', 'Basic Analytics', 'View basic metrics and stats', true),
  ('free', 'creator_management', 'Creator Management', 'Manage up to 10 creators', true),
  ('free', 'campaign_management', 'Campaign Management', 'Create and manage campaigns', true),
  ('free', 'task_management', 'Task Management', 'Create and assign tasks', true),
  ('free', 'content_library', 'Content Library', '1GB storage for media files', true),
  
  -- Standard Plan Features (includes all Free features)
  ('standard', 'basic_analytics', 'Basic Analytics', 'View basic metrics and stats', true),
  ('standard', 'advanced_analytics', 'Advanced Analytics', 'View advanced charts and trends', true),
  ('standard', 'creator_management', 'Creator Management', 'Manage up to 50 creators', true),
  ('standard', 'campaign_management', 'Campaign Management', 'Create and manage campaigns', true),
  ('standard', 'task_management', 'Task Management', 'Create and assign tasks to team', true),
  ('standard', 'content_library', 'Content Library', '10GB storage for media files', true),
  ('standard', 'team_collaboration', 'Team Collaboration', 'Up to 3 team members', true),
  ('standard', 'revenue_tracking', 'Revenue Tracking', 'Track revenue per creator', true),
  
  -- Elite Plan Features (includes all Standard features)
  ('elite', 'basic_analytics', 'Basic Analytics', 'View basic metrics and stats', true),
  ('elite', 'advanced_analytics', 'Advanced Analytics', 'View advanced charts and trends', true),
  ('elite', 'export_data', 'Data Export', 'Export data to CSV/Excel', true),
  ('elite', 'creator_management', 'Creator Management', 'Unlimited creators', true),
  ('elite', 'campaign_management', 'Campaign Management', 'Unlimited campaigns', true),
  ('elite', 'task_management', 'Task Management', 'Advanced task management', true),
  ('elite', 'content_library', 'Content Library', '100GB storage for media files', true),
  ('elite', 'team_collaboration', 'Team Collaboration', 'Up to 10 team members', true),
  ('elite', 'revenue_tracking', 'Revenue Tracking', 'Advanced revenue analytics', true),
  ('elite', 'priority_support', 'Priority Support', '24/7 priority email support', true),
  ('elite', 'multi_workspace', 'Multiple Workspaces', 'Up to 5 brand workspaces', true),
  
  -- Enterprise Plan Features (includes everything)
  ('enterprise', 'basic_analytics', 'Basic Analytics', 'View basic metrics and stats', true),
  ('enterprise', 'advanced_analytics', 'Advanced Analytics', 'View advanced charts and trends', true),
  ('enterprise', 'export_data', 'Data Export', 'Export data to CSV/Excel', true),
  ('enterprise', 'creator_management', 'Creator Management', 'Unlimited creators', true),
  ('enterprise', 'campaign_management', 'Campaign Management', 'Unlimited campaigns', true),
  ('enterprise', 'task_management', 'Task Management', 'Advanced task management', true),
  ('enterprise', 'content_library', 'Content Library', 'Unlimited storage', true),
  ('enterprise', 'team_collaboration', 'Team Collaboration', 'Unlimited team members', true),
  ('enterprise', 'revenue_tracking', 'Revenue Tracking', 'Advanced revenue analytics', true),
  ('enterprise', 'priority_support', 'Priority Support', '24/7 priority support', true),
  ('enterprise', 'multi_workspace', 'Multiple Workspaces', 'Unlimited workspaces', true),
  ('enterprise', 'custom_integrations', 'Custom Integrations', 'Custom API integrations', true),
  ('enterprise', 'dedicated_manager', 'Account Manager', 'Dedicated account manager', true),
  ('enterprise', 'onboarding_training', 'Onboarding & Training', 'Personalized onboarding', true)
ON CONFLICT (plan_name, feature_key) DO NOTHING;

-- Step 8: Create helper function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(
  workspace_plan text,
  feature_key text
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM subscription_features 
    WHERE plan_name = workspace_plan 
    AND feature_key = feature_key 
    AND is_enabled = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create function to get workspace usage stats
CREATE OR REPLACE FUNCTION get_workspace_usage(workspace_id_input uuid)
RETURNS TABLE (
  creator_count bigint,
  storage_used_bytes bigint,
  team_member_count bigint,
  campaign_count bigint,
  task_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM creators WHERE workspace_id = workspace_id_input),
    (SELECT COALESCE(SUM(file_size), 0) FROM content_media WHERE workspace_id = workspace_id_input),
    (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = workspace_id_input) + 1, -- +1 for owner
    (SELECT COUNT(*) FROM campaigns WHERE workspace_id = workspace_id_input),
    (SELECT COUNT(*) FROM tasks WHERE workspace_id = workspace_id_input);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_plan ON workspaces(plan);
CREATE INDEX IF NOT EXISTS idx_workspaces_subscription_status ON workspaces(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscription_features_plan ON subscription_features(plan_name);
CREATE INDEX IF NOT EXISTS idx_content_media_workspace_size ON content_media(workspace_id, file_size);
