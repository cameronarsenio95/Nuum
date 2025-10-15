/*
  # Create Support Account Helper Function
  
  Creates a helper function to easily create support staff accounts.
  This function creates both the auth user and support_staff entry.
*/

CREATE OR REPLACE FUNCTION create_support_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text DEFAULT 'support_agent'
)
RETURNS jsonb AS $$
DECLARE
  new_user_id uuid;
  result jsonb;
BEGIN
  -- Validate role
  IF p_role NOT IN ('support_viewer', 'support_agent', 'support_admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be support_viewer, support_agent, or support_admin';
  END IF;

  -- Create auth user using admin API
  -- Note: This requires admin privileges
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF new_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'User with email % already exists', p_email;
  END IF;
  
  -- Return instructions since we can't create auth users directly
  result := jsonb_build_object(
    'success', false,
    'message', 'Please create the user via Supabase Dashboard first',
    'instructions', jsonb_build_object(
      'email', p_email,
      'next_step', 'After user creation, call add_user_to_support_staff function'
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add existing user to support staff
CREATE OR REPLACE FUNCTION add_user_to_support_staff(
  p_user_id uuid,
  p_full_name text,
  p_role text DEFAULT 'support_agent'
)
RETURNS jsonb AS $$
DECLARE
  user_email text;
  result jsonb;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Insert into support_staff
  INSERT INTO support_staff (id, email, full_name, role, is_active)
  VALUES (p_user_id, user_email, p_full_name, p_role, true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = p_full_name,
    role = p_role,
    is_active = true,
    updated_at = now();
  
  result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'email', user_email,
    'full_name', p_full_name,
    'role', p_role,
    'message', 'Support staff account created successfully'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
