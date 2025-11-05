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

      // 1) EERST: probeer via workspace_members (owner, admin, member, viewer)
      const {
        data: membershipData,
        error: membershipError,
      } = await supabase
        .from('workspace_members')
        .select('workspaces(*)')
        .eq('user_id', user.id);

      if (membershipError) {
        console.error(
          '[useCurrentWorkspace] Error loading memberships, falling back to owner query:',
          membershipError
        );
      }

      let resolvedWorkspace: Workspace | null = null;

      if (membershipData && membershipData.length > 0) {
        const workspacesFromMembership = membershipData
          .map((row: any) => row.workspaces as Workspace | null)
          .filter(Boolean) as Workspace[];

        if (workspacesFromMembership.length > 0) {
          resolvedWorkspace = workspacesFromMembership[0];
          console.log(
            '[useCurrentWorkspace] Workspace resolved via workspace_members:',
            resolvedWorkspace.id
          );
        }
      }

      // 2) FALLBACK: als er geen membership-werkspace is gevonden,
      // gebruik de oude owner_id-query (voor legacy situaties)
      if (!resolvedWorkspace) {
        const {
          data: workspaceData,
          error: workspaceError,
        } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (workspaceError) {
          console.error(
            '[useCurrentWorkspace] Error loading workspace by owner_id:',
            workspaceError
          );
          setError('Failed to load workspace');
          setWorkspace(null);
          return;
        }

        if (!workspaceData) {
          console.warn(
            '[useCurrentWorkspace] No workspace found for user (no membership, no owner)'
          );
          setError('No workspace found');
          setWorkspace(null);
          return;
        }

        console.log(
          '[useCurrentWorkspace] Workspace resolved via owner_id fallback:',
          workspaceData.id
        );
        resolvedWorkspace = workspaceData as Workspace;
      }

      setWorkspace(resolvedWorkspace);
    } catch (err: any) {
      console.error('[useCurrentWorkspace] Unexpected error:', err);
      setError(err.message || 'An unexpected error occurred');
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    workspace,
    workspaceId: workspace?.id || null,
    loading,
    error,
    refetch: loadWorkspace,
  };
}
