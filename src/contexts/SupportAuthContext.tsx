import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { User } from '@supabase/supabase-js';

type SupportStaff = Database['public']['Tables']['support_staff']['Row'];

interface SupportAuthContextType {
  user: User | null;
  supportStaff: SupportStaff | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: 'view' | 'modify' | 'admin') => boolean;
  logAction: (
    actionType: string,
    entityType: string,
    entityId: string,
    details?: {
      customerEmail?: string;
      workspaceId?: string;
      workspaceName?: string;
      actionDetails?: any;
      previousState?: any;
      newState?: any;
      ticketReference?: string;
      notes?: string;
    }
  ) => Promise<void>;
}

const SupportAuthContext = createContext<SupportAuthContextType | undefined>(undefined);

export function SupportAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supportStaff, setSupportStaff] = useState<SupportStaff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadSupportStaff(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadSupportStaff(session.user.id);
      } else {
        setSupportStaff(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadSupportStaff = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_staff')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSupportStaff(data);

        await supabase
          .from('support_staff')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', userId);
      } else {
        setSupportStaff(null);
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error loading support staff:', error);
      setSupportStaff(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: staffData, error: staffError } = await supabase
          .from('support_staff')
          .select('*')
          .eq('id', data.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (staffError || !staffData) {
          await supabase.auth.signOut();
          throw new Error('Not authorized as support staff');
        }

        setSupportStaff(staffData);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupportStaff(null);
  };

  const hasPermission = (permission: 'view' | 'modify' | 'admin'): boolean => {
    if (!supportStaff || !supportStaff.is_active) return false;

    switch (permission) {
      case 'admin':
        return supportStaff.role === 'support_admin';
      case 'modify':
        return ['support_agent', 'support_admin'].includes(supportStaff.role);
      case 'view':
        return true;
      default:
        return false;
    }
  };

  const logAction = async (
    actionType: string,
    entityType: string,
    entityId: string,
    details?: {
      customerEmail?: string;
      workspaceId?: string;
      workspaceName?: string;
      actionDetails?: any;
      previousState?: any;
      newState?: any;
      ticketReference?: string;
      notes?: string;
    }
  ) => {
    if (!supportStaff) return;

    try {
      await supabase.from('support_audit_logs').insert({
        staff_id: supportStaff.id,
        staff_email: supportStaff.email,
        staff_name: supportStaff.full_name,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        customer_email: details?.customerEmail || null,
        workspace_id: details?.workspaceId || null,
        workspace_name: details?.workspaceName || null,
        action_details: details?.actionDetails || {},
        previous_state: details?.previousState || null,
        new_state: details?.newState || null,
        ticket_reference: details?.ticketReference || null,
        notes: details?.notes || null,
      });
    } catch (error) {
      console.error('Error logging support action:', error);
    }
  };

  const value = {
    user,
    supportStaff,
    loading,
    signIn,
    signOut,
    hasPermission,
    logAction,
  };

  return <SupportAuthContext.Provider value={value}>{children}</SupportAuthContext.Provider>;
}

export function useSupportAuth() {
  const context = useContext(SupportAuthContext);
  if (context === undefined) {
    throw new Error('useSupportAuth must be used within a SupportAuthProvider');
  }
  return context;
}
