import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface DemoContextType {
  isDemoMode: boolean;
  demoWorkspace: Workspace | null;
  demoToken: string | null;
  loading: boolean;
  error: string | null;
  initDemoMode: (token: string) => Promise<void>;
  exitDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoWorkspace, setDemoWorkspace] = useState<Workspace | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initDemoMode = async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: isValid, error: validationError } = await supabase
        .rpc('is_demo_link_valid', { link_token: token });

      if (validationError) throw validationError;
      if (!isValid) {
        setError('This demo link is invalid or has expired');
        setLoading(false);
        return;
      }

      const { data: demoLink, error: linkError } = await supabase
        .from('demo_links')
        .select(`
          id,
          demo_workspace_id,
          demo_workspaces (
            workspace_id,
            workspaces (*)
          )
        `)
        .eq('token', token)
        .maybeSingle();

      if (linkError) throw linkError;
      if (!demoLink) {
        setError('Demo link not found');
        setLoading(false);
        return;
      }

      const workspaceData = (demoLink as any).demo_workspaces?.workspaces;
      if (!workspaceData) {
        setError('Demo workspace not found');
        setLoading(false);
        return;
      }

      await supabase.rpc('increment_demo_link_view_count', { link_id: demoLink.id });

      await supabase.from('demo_link_analytics').insert({
        demo_link_id: demoLink.id,
        accessed_at: new Date().toISOString(),
        pages_viewed: [],
      });

      setDemoWorkspace(workspaceData);
      setDemoToken(token);
      setIsDemoMode(true);
      sessionStorage.setItem('demo_token', token);
      sessionStorage.setItem('demo_workspace', JSON.stringify(workspaceData));
    } catch (err) {
      console.error('Error initializing demo mode:', err);
      setError('Failed to load demo workspace');
    } finally {
      setLoading(false);
    }
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoWorkspace(null);
    setDemoToken(null);
    setError(null);
    sessionStorage.removeItem('demo_token');
    sessionStorage.removeItem('demo_workspace');
  };

  useEffect(() => {
    const savedToken = sessionStorage.getItem('demo_token');
    const savedWorkspace = sessionStorage.getItem('demo_workspace');

    if (savedToken && savedWorkspace) {
      try {
        const workspace = JSON.parse(savedWorkspace);
        setDemoWorkspace(workspace);
        setDemoToken(savedToken);
        setIsDemoMode(true);
      } catch (err) {
        console.error('Error restoring demo session:', err);
        sessionStorage.removeItem('demo_token');
        sessionStorage.removeItem('demo_workspace');
      }
    }
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoWorkspace,
        demoToken,
        loading,
        error,
        initDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
