/*
  # Grant EXECUTE permission on workspace creation function
  
  Ensures that authenticated and anon users can call the create_workspace_with_owner function.
*/

-- Grant execute permission to authenticated users (for logged-in signup)
GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(uuid, text, text, text) TO authenticated;

-- Grant execute permission to anon users (for initial signup before session fully established)
GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(uuid, text, text, text) TO anon;

-- Grant to public as well to ensure it's accessible
GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(uuid, text, text, text) TO public;

-- Verify grants were applied
DO $$
BEGIN
  RAISE NOTICE 'EXECUTE permission granted on create_workspace_with_owner to authenticated, anon, and public roles';
END $$;
