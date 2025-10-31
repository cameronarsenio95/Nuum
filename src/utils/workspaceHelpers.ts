import { supabase } from '../lib/supabase';

/**
 * Generates a unique workspace slug from a company name
 * Automatically appends -2, -3, etc. if the slug is already taken
 */
export async function generateUniqueSlug(companyName: string, userId: string): Promise<string> {
  const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + userId.substring(0, 8);

  let slug = baseSlug;
  let attempt = 1;
  const maxAttempts = 10;

  while (attempt <= maxAttempts) {
    // Check if slug exists
    const { data, error } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[Slug Generation] Error checking slug availability:', error);
      throw new Error('Failed to verify workspace slug availability');
    }

    // If no workspace with this slug exists, we can use it
    if (!data) {
      console.log(`[Slug Generation] Generated unique slug: ${slug} (attempt ${attempt})`);
      return slug;
    }

    // Slug exists, try with suffix
    attempt++;
    slug = `${baseSlug}-${attempt}`;
    console.log(`[Slug Generation] Slug collision, trying: ${slug}`);
  }

  // If we couldn't find a unique slug after max attempts, use timestamp
  const timestampSlug = `${baseSlug}-${Date.now()}`;
  console.warn(`[Slug Generation] Max attempts reached, using timestamp: ${timestampSlug}`);
  return timestampSlug;
}

/**
 * Atomically creates a workspace with the owner as a member
 * Uses the database function to ensure consistency
 */
export async function createWorkspaceWithOwner(
  ownerId: string,
  name: string,
  slug: string,
  plan: string = 'standard'
): Promise<{ workspace_id: string; membership_id: string | null }> {
  console.log('[Workspace Creation] Calling create_workspace_with_owner RPC:', {
    ownerId,
    name,
    slug,
    plan
  });

  const { data, error } = await supabase.rpc('create_workspace_with_owner', {
    p_owner_id: ownerId,
    p_name: name,
    p_slug: slug,
    p_plan: plan
  });

  if (error) {
    console.error('[Workspace Creation] RPC error:', error);
    console.error('[Workspace Creation] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  if (!data) {
    console.error('[Workspace Creation] No data returned from RPC');
    throw new Error('Failed to create workspace: no data returned');
  }

  console.log('[Workspace Creation] Success:', data);

  return {
    workspace_id: data.workspace_id,
    membership_id: data.membership_id
  };
}
