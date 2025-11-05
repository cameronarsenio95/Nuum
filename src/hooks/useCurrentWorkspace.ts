/**
 * useCurrentWorkspace Hook
 *
 * IMPORTANT: All data in this module comes from Supabase.
 * Do NOT use Bolt database or any local DB as a source of truth.
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

      // Load all workspaces where user is a member (any role)
      const { data, error: workspaceError } = await supabase
        .from('workspace_members')
        .select('workspaces(*)')
        .eq('user_id', user.id);

      if (workspaceError) {
        console.error('[useCurrentWorkspace]', workspaceError);
        setError('Failed to load workspace');
        return;
      }

      const workspaces = data?.map(row => row.workspaces).filter(Boolean) ?? [];

      console.log('[useCurrentWorkspace] Loaded from Supabase:', workspaces);

      if (workspaces.length === 0) {
        console.warn('[useCurrentWorkspace] No workspace found for user');
        setError('No workspace found');
        return;
      }

      // Set the first workspace as the current workspace
      setWorkspace(workspaces[0] as Workspace);
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
