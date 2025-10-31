import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';

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
              const workspaceSlug = `workspace-${session.user.id.substring(0, 8)}`;
              const workspaceName = session.user.user_metadata?.company || `${fullName}'s Workspace`;

              const workspacePayload = {
                name: workspaceName,
                slug: workspaceSlug,
                plan: 'standard',
                owner_id: session.user.id,
                trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                trial_started_at: new Date().toISOString(),
                subscription_status: 'trialing',
              };

              console.log('[OAuth] Creating workspace with payload:', JSON.stringify(workspacePayload, null, 2));

              const { data: newWorkspace, error: workspaceError } = await supabase
                .from('workspaces')
                .insert(workspacePayload)
                .select()
                .single();

              console.log('[OAuth] Workspace creation response:', {
                data: newWorkspace,
                error: workspaceError,
                fullResponse: JSON.stringify({ data: newWorkspace, error: workspaceError }, null, 2)
              });

              if (workspaceError) {
                console.error('[OAuth] ❌ Workspace creation error:', workspaceError);
                console.error('[OAuth] Error details:', JSON.stringify(workspaceError, null, 2));
              } else if (newWorkspace) {
                console.log('[OAuth] ✅ Workspace created successfully:', newWorkspace.id);
                console.log('[OAuth] Starting polling for workspace membership (5 attempts × 300ms)...');

                let membershipFound = false;
                const maxAttempts = 5;
                const pollDelay = 300;

                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                  console.log(`[OAuth] Polling attempt ${attempt}/${maxAttempts}...`);

                  await new Promise(resolve => setTimeout(resolve, pollDelay));

                  const { data: membership, error: checkError } = await supabase
                    .from('workspace_members')
                    .select('id, role, created_at')
                    .eq('workspace_id', newWorkspace.id)
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                  console.log(`[OAuth] Attempt ${attempt} result:`, {
                    found: !!membership,
                    data: membership,
                    error: checkError,
                    fullResponse: JSON.stringify({ data: membership, error: checkError }, null, 2)
                  });

                  if (checkError) {
                    console.error(`[OAuth] ❌ Error on attempt ${attempt}:`, JSON.stringify(checkError, null, 2));
                    if (attempt === maxAttempts) {
                      console.error('[OAuth] All attempts failed');
                    }
                    continue;
                  }

                  if (membership) {
                    membershipFound = true;
                    console.log(`[OAuth] ✅ Membership found on attempt ${attempt}:`, membership);
                    break;
                  }

                  console.log(`[OAuth] Membership not found on attempt ${attempt}, retrying...`);
                }

                if (!membershipFound) {
                  console.error('[OAuth] ❌ Workspace membership not found after all attempts');
                  console.error('[OAuth] This may indicate the trigger did not fire correctly');
                }
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
