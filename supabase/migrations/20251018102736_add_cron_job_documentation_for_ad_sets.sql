/*
  # Cron Job Setup for Ad Set Auto-Completion

  ## Overview
  This migration adds documentation and helper function for setting up a daily cron job
  to automatically complete expired ad sets.

  ## Manual Cron Setup Instructions

  To automatically complete expired ad sets daily, set up a cron job using one of these methods:

  ### Option 1: Using Supabase Dashboard (Recommended)
  1. Go to your Supabase project dashboard
  2. Navigate to Database → Extensions
  3. Enable the "pg_cron" extension if not already enabled
  4. Go to Database → Functions
  5. Create a new cron job:
     ```sql
     SELECT cron.schedule(
       'complete-expired-ad-sets-daily',
       '0 0 * * *', -- Run at midnight every day
       $$
       SELECT net.http_post(
         url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/complete-expired-ad-sets',
         headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
       );
       $$
     );
     ```

  ### Option 2: Using External Cron Service
  Set up a daily cron job (e.g., using GitHub Actions, Vercel Cron, or Render Cron Jobs)
  to call the Edge Function:
  
  ```bash
  curl -X POST \
    https://YOUR_PROJECT_REF.supabase.co/functions/v1/complete-expired-ad-sets \
    -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json"
  ```

  ### Option 3: Direct Database Call (Alternative)
  If you prefer to run the completion logic directly in the database without the Edge Function:
  
  ```sql
  SELECT cron.schedule(
    'complete-expired-ad-sets-daily',
    '0 0 * * *', -- Run at midnight every day
    $$
    SELECT * FROM complete_expired_ad_sets();
    $$
  );
  ```

  ## Testing the Setup

  To manually test the auto-completion:
  1. Call the Edge Function directly using curl (see above)
  2. Or run the database function directly:
     ```sql
     SELECT * FROM complete_expired_ad_sets();
     ```

  ## Monitoring
  - Check the Edge Function logs in Supabase Dashboard → Edge Functions
  - The function returns the count of completed ad sets
  - All status changes are logged in the activity_log table

  ## Important Notes
  1. The cron job requires the "pg_cron" extension to be enabled
  2. Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY with your actual values
  3. The Edge Function is already deployed and ready to use
  4. Ad sets are only auto-completed if their end_date has passed AND status is 'active'
  5. Ad sets with NULL end_date (All Time) are never auto-completed
*/

-- Create a helper view to monitor expiring ad sets
CREATE OR REPLACE VIEW expiring_ad_sets_monitor AS
SELECT 
  ads.id,
  ads.name,
  ads.status,
  ads.duration_days,
  ads.start_date,
  ads.end_date,
  c.name AS campaign_name,
  cr.name AS creator_name,
  CASE 
    WHEN ads.end_date IS NOT NULL AND ads.end_date <= NOW() THEN 'EXPIRED'
    WHEN ads.end_date IS NOT NULL AND ads.end_date <= NOW() + interval '2 days' THEN 'EXPIRING_SOON'
    WHEN ads.end_date IS NULL THEN 'NO_EXPIRY'
    ELSE 'ACTIVE'
  END AS expiry_status,
  CASE 
    WHEN ads.end_date IS NOT NULL THEN EXTRACT(DAY FROM (ads.end_date - NOW()))::integer
    ELSE NULL
  END AS days_until_expiry
FROM ad_sets ads
JOIN campaigns c ON c.id = ads.campaign_id
JOIN creators cr ON cr.id = ads.creator_id
WHERE ads.status IN ('active', 'draft')
ORDER BY 
  CASE 
    WHEN ads.end_date IS NULL THEN 2
    WHEN ads.end_date <= NOW() THEN 0
    ELSE 1
  END,
  ads.end_date ASC NULLS LAST;

-- Add comment for documentation
COMMENT ON VIEW expiring_ad_sets_monitor IS 'Monitor view for tracking ad sets that are expired, expiring soon, or have no expiry. Use this to verify the auto-completion system is working correctly.';

-- Create a manual trigger function that can be called on-demand
CREATE OR REPLACE FUNCTION manual_complete_expired_ad_sets()
RETURNS TABLE(
  message text,
  completed_count integer,
  completed_ad_sets jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count integer;
  result_ids uuid[];
  ad_set_details jsonb;
BEGIN
  -- Get the expired ad sets before completing them
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ads.id,
      'name', ads.name,
      'campaign', c.name,
      'creator', cr.name,
      'end_date', ads.end_date
    )
  )
  INTO ad_set_details
  FROM ad_sets ads
  JOIN campaigns c ON c.id = ads.campaign_id
  JOIN creators cr ON cr.id = ads.creator_id
  WHERE ads.status = 'active'
    AND ads.end_date IS NOT NULL
    AND ads.end_date <= NOW();

  -- Call the completion function
  SELECT completed_count, completed_ad_set_ids
  INTO result_count, result_ids
  FROM complete_expired_ad_sets();

  -- Return results
  RETURN QUERY SELECT 
    format('Successfully completed %s expired ad sets', result_count)::text,
    result_count,
    COALESCE(ad_set_details, '[]'::jsonb);
END;
$$;

COMMENT ON FUNCTION manual_complete_expired_ad_sets() IS 'Manually trigger ad set completion and get detailed results. Useful for testing and monitoring.';
