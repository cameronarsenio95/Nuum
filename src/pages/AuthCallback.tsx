import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { generateUniqueSlug, createWorkspaceWithOwner } from '../utils/workspaceHelpers';

export function AuthCallback() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        const error = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

        if (error) {
          console.error('[OAuth] Error from provider:', error, errorDescription);
          setError(errorDescription || error);
          setProcessing(false);

          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[OAuth] Session error:', sessionError);
          setError('Failed to establish session. Please try again.');
          setProcessing(false);

          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          return;
        }

        if (session?.user) {
          console.log('[OAuth] Session established for user:', session.user.id);

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!profile) {
            console.log('[OAuth] Creating profile for OAuth user');

            const email = session.user.email || '';
            const fullName = session.user.user_metadata?.full_name ||
                           session.user.user_metadata?.name ||
                           email.split('@')[0];

            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: email,
                full_name: fullName,
                company: session.user.user_metadata?.company || '',
                notifications_enabled: true,
                onboarding_completed: false,
              });

            if (profileError) {
              console.error('[OAuth] Profile creation error:', profileError);
            }

            const { data: existingWorkspace } = await supabase
              .from('workspace_members')
              .select('workspace_id')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (!existingWorkspace) {
              const workspaceName = session.user.user_metadata?.company || `${fullName}'s Workspace`;

              console.log('[OAuth] Generating unique workspace slug...');
              const workspaceSlug = await generateUniqueSlug(workspaceName, session.user.id);
              console.log('[OAuth] Using slug:', workspaceSlug);

              console.log('[OAuth] Creating workspace atomically with owner membership...');
              try {
                const result = await createWorkspaceWithOwner(
                  session.user.id,
                  workspaceName,
                  workspaceSlug,
                  'standard'
                );

                console.log('[OAuth] ✅ Workspace and membership created successfully:', {
                  workspaceId: result.workspace_id,
                  membershipId: result.membership_id
                });
              } catch (workspaceError) {
                console.error('[OAuth] ❌ Failed to create workspace:', workspaceError);
              }
            }
          }

          console.log('[OAuth] Redirecting to dashboard');
          window.location.href = '/dashboard';
        } else {
          console.log('[OAuth] No session found, redirecting to home');
          setError('Authentication incomplete. Please try again.');
          setProcessing(false);

          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }
      } catch (err) {
        console.error('[OAuth] Callback error:', err);
        setError('An unexpected error occurred. Please try again.');
        setProcessing(false);

        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-linear-bg light:bg-linear-light-bg">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-2 dark:text-text-primary light:text-text-light-primary">
            Authentication Failed
          </h2>
          <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-4">
            {error}
          </p>
          <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
            Redirecting you back...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-linear-bg light:bg-linear-light-bg">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-sm dark:text-text-secondary light:text-text-light-secondary">
          {processing ? 'Completing authentication...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}
