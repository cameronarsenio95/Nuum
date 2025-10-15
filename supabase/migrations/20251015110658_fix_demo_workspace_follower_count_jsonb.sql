/*
  # Fix Demo Workspace - Use JSONB for follower_count

  ## Overview
  Updates the create_demo_workspace_from_template function to use JSONB structure
  for follower_count column as per the actual schema
  
  ## Changes
  - Change follower_count from integer to JSONB format with platform breakdown
  - Maintain realistic follower counts per platform

  ## Important Notes
  - This fixes the type mismatch error for follower_count column
*/

-- Function to create a demo workspace with sample data
CREATE OR REPLACE FUNCTION create_demo_workspace_from_template(
  source_workspace_id uuid,
  demo_name text DEFAULT 'Demo Workspace',
  demo_description text DEFAULT 'Experience the full power of NUUM'
)
RETURNS uuid AS $$
DECLARE
  new_workspace_id uuid;
  new_demo_workspace_id uuid;
  campaign_1_id uuid;
  campaign_2_id uuid;
  campaign_3_id uuid;
  creator_ids uuid[];
BEGIN
  -- Verify the user owns the source workspace
  IF NOT EXISTS (
    SELECT 1 FROM workspaces
    WHERE id = source_workspace_id
    AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You do not have permission to create a demo from this workspace';
  END IF;

  -- Create new demo workspace
  INSERT INTO workspaces (
    name,
    slug,
    plan,
    max_team_members,
    max_creators,
    max_storage_gb,
    subscription_status,
    owner_id,
    features,
    settings
  ) VALUES (
    demo_name,
    'demo-' || encode(gen_random_bytes(8), 'hex'),
    'elite',
    20,
    500,
    100,
    'active',
    auth.uid(),
    jsonb_build_object(
      'revenue_tracking', true,
      'advanced_analytics', true,
      'team_collaboration', true,
      'priority_support', true,
      'task_assignment', true
    ),
    jsonb_build_object('is_demo', true)
  )
  RETURNING id INTO new_workspace_id;

  -- Create sample campaigns
  INSERT INTO campaigns (workspace_id, name, brand, status, start_date, end_date, budget, total_revenue, description, spark_url)
  VALUES 
    (
      new_workspace_id,
      'Summer Fashion Collection 2025',
      'StyleCo',
      'active',
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE + INTERVAL '60 days',
      50000,
      62000,
      'Launching our new summer collection with UGC creators focusing on sustainable fashion and beachwear',
      'https://spark.app/summer-fashion-2025'
    )
  RETURNING id INTO campaign_1_id;

  INSERT INTO campaigns (workspace_id, name, brand, status, start_date, end_date, budget, total_revenue, description, spark_url)
  VALUES 
    (
      new_workspace_id,
      'Skincare Routine Launch',
      'GlowLabs',
      'active',
      CURRENT_DATE - INTERVAL '15 days',
      CURRENT_DATE + INTERVAL '45 days',
      35000,
      41000,
      'Introducing our new 3-step skincare routine with authentic before/after creator content',
      'https://spark.app/skincare-launch'
    )
  RETURNING id INTO campaign_2_id;

  INSERT INTO campaigns (workspace_id, name, brand, status, start_date, end_date, budget, total_revenue, description)
  VALUES 
    (
      new_workspace_id,
      'Fitness App Beta Testing',
      'FitTrack',
      'draft',
      CURRENT_DATE + INTERVAL '15 days',
      CURRENT_DATE + INTERVAL '75 days',
      25000,
      0,
      'Beta testing campaign for our new AI-powered fitness tracking app with fitness influencers'
    )
  RETURNING id INTO campaign_3_id;

  -- Create sample creators with JSONB follower counts
  WITH inserted_creators AS (
    INSERT INTO creators (workspace_id, name, email, instagram_handle, tiktok_handle, snapchat_handle, follower_count, engagement_rate, status, notes)
    VALUES 
      (new_workspace_id, 'Sarah Martinez', 'sarah@example.com', '@sarahstyle', '@sarahfashion', NULL, 
       '{"instagram": 85000, "tiktok": 40000}'::jsonb, 4.8, 'active', 'Fashion & Lifestyle - Specializes in sustainable fashion content'),
      (new_workspace_id, 'Alex Chen', 'alex@example.com', '@alexfitness', '@alexworkouts', 'alexfitpro', 
       '{"instagram": 45000, "tiktok": 32000, "snapchat": 12000}'::jsonb, 5.2, 'active', 'Fitness & Wellness - Professional fitness trainer'),
      (new_workspace_id, 'Emma Rodriguez', 'emma@example.com', '@emmaskincare', '@glowwithemma', NULL, 
       '{"instagram": 96000, "tiktok": 60000}'::jsonb, 4.5, 'active', 'Beauty & Skincare - Skincare specialist'),
      (new_workspace_id, 'Marcus Johnson', 'marcus@example.com', '@marcusstyle', '@mjfashion', 'marcusstyle', 
       '{"instagram": 125000, "tiktok": 58000, "snapchat": 20000}'::jsonb, 3.9, 'active', 'Menswear & Fashion - Menswear fashion creator'),
      (new_workspace_id, 'Priya Patel', 'priya@example.com', '@priyabeauty', '@priyamakeup', NULL, 
       '{"instagram": 112000, "tiktok": 66000}'::jsonb, 4.7, 'active', 'Beauty & Makeup - Makeup artist'),
      (new_workspace_id, 'Jake Williams', 'jake@example.com', '@jakeoutdoors', '@jakewild', 'jakewilliams', 
       '{"instagram": 52000, "tiktok": 28000, "snapchat": 15000}'::jsonb, 5.5, 'pending', 'Outdoor & Adventure - Adventure creator'),
      (new_workspace_id, 'Nina Foster', 'nina@example.com', '@ninawellness', '@mindfulnina', NULL, 
       '{"instagram": 42000, "tiktok": 25000}'::jsonb, 6.1, 'active', 'Wellness & Mindfulness - Wellness coach'),
      (new_workspace_id, 'Tyler Brooks', 'tyler@example.com', '@tylertech', '@techtyler', 'tylertech', 
       '{"instagram": 78000, "tiktok": 48000, "snapchat": 16000}'::jsonb, 4.2, 'active', 'Tech & Gadgets - Tech reviewer')
    RETURNING id
  )
  SELECT array_agg(id) INTO creator_ids FROM inserted_creators;

  -- Assign creators to campaigns
  INSERT INTO campaign_creators (campaign_id, creator_id, status, rate, deliverables)
  VALUES 
    (campaign_1_id, creator_ids[1], 'confirmed', 2500, '{"videos": 3, "photos": 5}'::jsonb),
    (campaign_1_id, creator_ids[4], 'confirmed', 3200, '{"videos": 2, "photos": 4}'::jsonb),
    (campaign_1_id, creator_ids[6], 'pending', 1800, '{"videos": 2, "photos": 3}'::jsonb),
    (campaign_2_id, creator_ids[3], 'confirmed', 3500, '{"videos": 4, "photos": 6}'::jsonb),
    (campaign_2_id, creator_ids[5], 'confirmed', 2800, '{"videos": 3, "photos": 5}'::jsonb),
    (campaign_2_id, creator_ids[7], 'confirmed', 1500, '{"videos": 2, "photos": 4}'::jsonb),
    (campaign_3_id, creator_ids[2], 'invited', 2200, '{"videos": 3, "photos": 4}'::jsonb),
    (campaign_3_id, creator_ids[8], 'invited', 2400, '{"videos": 2, "photos": 3}'::jsonb);

  -- Create sample tasks
  INSERT INTO tasks (workspace_id, campaign_id, title, description, status, priority, due_date)
  VALUES 
    (new_workspace_id, campaign_1_id, 'Review creator content submissions', 'Review and approve the latest batch of summer collection content', 'in_progress', 'high', CURRENT_DATE + 2),
    (new_workspace_id, campaign_1_id, 'Send product samples', 'Ship summer collection samples for content creation', 'pending', 'medium', CURRENT_DATE + 5),
    (new_workspace_id, campaign_2_id, 'Schedule content posting', 'Coordinate posting schedule for Week 3', 'pending', 'medium', CURRENT_DATE + 7),
    (new_workspace_id, campaign_2_id, 'Analyze Week 1 performance', 'Review analytics and engagement metrics', 'completed', 'high', CURRENT_DATE - 2),
    (new_workspace_id, campaign_3_id, 'Finalize creator contracts', 'Complete contract negotiations', 'pending', 'high', CURRENT_DATE + 10);

  -- Create sample ad sets
  INSERT INTO ad_sets (campaign_id, name, platform, status, budget, spend, impressions, clicks, conversions, total_revenue, spark_code)
  VALUES 
    (campaign_1_id, 'Summer Vibes - Instagram Stories', 'instagram', 'active', 15000, 12450, 1250000, 48500, 3250, 28000, 'SPARK123456'),
    (campaign_1_id, 'Beachwear Collection - TikTok', 'tiktok', 'active', 20000, 18900, 2100000, 95000, 5600, 34000, 'SPARK234567'),
    (campaign_2_id, 'Skincare Routine - Instagram Reels', 'instagram', 'active', 12000, 10800, 980000, 42000, 2800, 24000, 'SPARK456789'),
    (campaign_2_id, 'Before & After - TikTok', 'tiktok', 'active', 18000, 16500, 1800000, 78000, 4200, 17000, 'SPARK567890');

  -- Create sample content media
  INSERT INTO content_media (workspace_id, campaign_id, creator_id, title, media_type, platform, status, thumbnail_url)
  VALUES 
    (new_workspace_id, campaign_1_id, creator_ids[1], 'Summer Beach Outfit Try-On', 'video', 'tiktok', 'approved', 'https://picsum.photos/seed/demo1/400/600'),
    (new_workspace_id, campaign_1_id, creator_ids[1], 'Sustainable Fashion Haul', 'video', 'instagram', 'approved', 'https://picsum.photos/seed/demo2/400/600'),
    (new_workspace_id, campaign_1_id, creator_ids[4], 'Mens Summer Style Guide', 'video', 'tiktok', 'approved', 'https://picsum.photos/seed/demo3/400/600'),
    (new_workspace_id, campaign_2_id, creator_ids[3], 'Morning Skincare Routine', 'video', 'instagram', 'approved', 'https://picsum.photos/seed/demo4/400/600'),
    (new_workspace_id, campaign_2_id, creator_ids[3], '30-Day Skin Transformation', 'video', 'tiktok', 'approved', 'https://picsum.photos/seed/demo5/400/600'),
    (new_workspace_id, campaign_2_id, creator_ids[5], 'Product Review: GlowLabs Serum', 'video', 'instagram', 'pending', 'https://picsum.photos/seed/demo6/400/600'),
    (new_workspace_id, campaign_2_id, creator_ids[7], 'Self-Care Sunday Routine', 'video', 'tiktok', 'approved', 'https://picsum.photos/seed/demo7/400/600');

  -- Create demo workspace record
  INSERT INTO demo_workspaces (workspace_id, name, description, is_active, created_by)
  VALUES (
    new_workspace_id,
    demo_name,
    demo_description,
    true,
    auth.uid()
  )
  RETURNING id INTO new_demo_workspace_id;

  RETURN new_demo_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;