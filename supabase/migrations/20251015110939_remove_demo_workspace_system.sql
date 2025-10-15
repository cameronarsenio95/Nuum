/*
  # Remove Demo Workspace System

  ## Overview
  Completely removes the demo workspace functionality from the database
  
  ## Changes
  - Drop demo_workspaces table
  - Drop create_demo_workspace_from_template function
  - Clean up any related data

  ## Important Notes
  - This is a complete removal of the demo workspace feature
*/

-- Drop the function first
DROP FUNCTION IF EXISTS create_demo_workspace_from_template(uuid, text, text);

-- Drop the demo_workspaces table
DROP TABLE IF EXISTS demo_workspaces CASCADE;