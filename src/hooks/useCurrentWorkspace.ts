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

      // Load user's workspace (assuming user is owner or member)
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (workspaceError) {
        console.error('[useCurrentWorkspace] Error loading workspace:', workspaceError);
        setError('Failed to load workspace');
        return;
      }

      if (!workspaceData) {
        console.warn('[useCurrentWorkspace] No workspace found for user');
        setError('No workspace found');
        return;
      }

      console.log('[useCurrentWorkspace] Workspace loaded:', workspaceData.id);
      setWorkspace(workspaceData);
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
