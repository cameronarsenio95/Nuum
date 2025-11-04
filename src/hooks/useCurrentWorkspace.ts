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
type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'];

interface WorkspaceWithRole extends Workspace {
  role?: string;
}

interface UseCurrentWorkspaceReturn {
  workspace: WorkspaceWithRole | null;
  workspaceId: string | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCurrentWorkspace(): UseCurrentWorkspaceReturn {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = async () => {
    if (!user) {
      setWorkspace(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useCurrentWorkspace] Loading workspaces via membership for user:', user.id);

      // Load ALL workspaces where user is a member (owner, admin, member, or viewer)
      // Using inner join to ensure we only get workspaces with active membership
      const { data: workspacesData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*, workspace_members!inner(role, user_id)')
        .eq('workspace_members.user_id', user.id)
        .order('created_at', { ascending: true });

      console.log('[useCurrentWorkspace] Memberships result:', { data: workspacesData, error: workspaceError });

      if (workspaceError) {
        console.error('[useCurrentWorkspace] Error loading workspaces:', workspaceError);
        setError('Failed to load workspaces');
        return;
      }

      if (!workspacesData || workspacesData.length === 0) {
        console.warn('[useCurrentWorkspace] No workspace memberships found for user');
        setError('No workspace found');
        return;
      }

      // Take the first workspace (or could be enhanced to use URL slug later)
      const firstWorkspace = workspacesData[0];
      const membership = Array.isArray(firstWorkspace.workspace_members)
        ? firstWorkspace.workspace_members[0]
        : firstWorkspace.workspace_members;

      const userRole = membership?.role || 'member';

      console.log('[useCurrentWorkspace] Selected workspace:', {
        id: firstWorkspace.id,
        name: firstWorkspace.name,
        role: userRole,
        totalWorkspaces: workspacesData.length
      });

      setWorkspace({ ...firstWorkspace, role: userRole });
      setRole(userRole);
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
    role,
    loading,
    error,
    refetch: loadWorkspace,
  };
}
