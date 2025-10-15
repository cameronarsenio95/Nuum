/*
  # Fix get_workspace_usage function return type

  1. Changes
    - Change storage_used_bytes from numeric to bigint using CAST
    - This fixes the type mismatch error in the function
*/

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
    (SELECT CAST(COALESCE(SUM(file_size), 0) AS bigint) FROM content_media WHERE workspace_id = workspace_id_input),
    (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = workspace_id_input) + 1,
    (SELECT COUNT(*) FROM campaigns WHERE workspace_id = workspace_id_input),
    (SELECT COUNT(*) FROM tasks WHERE workspace_id = workspace_id_input);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
