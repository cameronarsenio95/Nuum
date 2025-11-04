// IMPORTANT: All data in this module comes from Supabase. Do not use any Bolt-local database as a source of truth.
/**
 * useCurrentWorkspace Hook
 *
 * Centralizes workspace resolution logic across the entire app.
 * All components should use this instead of manually loading workspace.
 *
 * Usage:
 * ```typescript
 * const { workspace, workspaceId, loading, error } = useCurrentWorkspace();
 *
 * if (loading) return <Loading />;
 * if (error) return <Error />;
 * if (!workspace) return <NoWorkspace />;
 *
 * // Use workspaceId in queries
 * const { data } = await supabase
 *   .from('campaigns')
 *   .select('*')
 *   .eq('workspace_id', workspaceId);
 * ```
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface UseCurrentWorkspaceReturn {
  workspace: Workspace | null;
  workspaceId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCurrentWorkspace(): UseCurrentWorkspaceReturn {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = async () => {
    if (!user) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useCurrentWorkspace] Loading workspace for user:', user.id);

      // Load workspace via workspace_members (works for owners AND invited members)
      const { data: membershipData, error: membershipError } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          workspaces (
            id, name, slug, plan, owner_id, max_team_members, max_creators, max_storage_gb,
            subscription_status, stripe_customer_id, stripe_subscription_id, trial_started_at,
            trial_ends_at, features, created_at, updated_at
          )
        `)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        console.error('[useCurrentWorkspace] Error loading membership:', membershipError);
        setError('Failed to load workspace');
        return;
      }

      if (!membershipData || !membershipData.workspaces) {
        console.warn('[useCurrentWorkspace] No workspace found for user');
        setError('No workspace found');
        return;
      }

      const workspaceData = Array.isArray(membershipData.workspaces)
        ? membershipData.workspaces[0]
        : membershipData.workspaces;

      console.log('[useCurrentWorkspace] Workspace loaded:', workspaceData.id);
      setWorkspace(workspaceData as Workspace);
    } catch (err: any) {
      console.error('[useCurrentWorkspace] Unexpected error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [user?.id]);

  return {
    workspace,
    workspaceId: workspace?.id || null,
    loading,
    error,
    refetch: loadWorkspace,
  };
}
