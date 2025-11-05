  const loadWorkspace = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('[DASHBOARD] Loading workspace for user:', user.id);

      // 1) PROBEER EERST: alle workspaces via workspace_members (owner, admin, member, viewer)
      const {
        data: membershipData,
        error: membershipError,
      } = await supabase
        .from('workspace_members')
        .select('role, workspaces(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (membershipError) {
        console.error(
          '[DASHBOARD] Error loading memberships (will fallback to owner):',
          membershipError
        );
      }

      let resolvedWorkspace: Workspace | null = null;

      const memberships = (membershipData || []) as any[];

      if (memberships.length > 0) {
        // 1a) Probeer eerst een workspace te pakken die NIET van de huidige user is
        //     (dus een workspace waar je voor bent uitgenodigd).
        const invitedMembership = memberships.find((m) => {
          const ws = m.workspaces as Workspace | null;
          if (!ws) return false;
          return ws.owner_id !== user.id;
        });

        if (invitedMembership?.workspaces) {
          resolvedWorkspace = invitedMembership.workspaces as Workspace;
          console.log(
            '[DASHBOARD] Workspace resolved via invited membership:',
            resolvedWorkspace.id
          );
        } else {
          // 1b) Anders: pak de eerste workspace waar je lid van bent
          const firstMembershipWithWorkspace = memberships.find((m) => m.workspaces);

          if (firstMembershipWithWorkspace?.workspaces) {
            resolvedWorkspace = firstMembershipWithWorkspace.workspaces as Workspace;
            console.log(
              '[DASHBOARD] Workspace resolved via first membership:',
              resolvedWorkspace.id
            );
          }
        }
      }

      // 2) FALLBACK: als er geen membership-workspace is gevonden, gebruik de oude owner_id-logica
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
            '[DASHBOARD] Error loading workspace by owner_id:',
            workspaceError
          );
          setWorkspace(null);
          return;
        }

        console.log('[DASHBOARD] Workspace loaded via owner_id:', workspaceData?.id);

        if (!workspaceData) {
          // Geen workspace → auto-create zoals voorheen
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

          const displayName = profileData?.full_name || user.email;
          const slug = user.email?.split('@')[0] || 'workspace';

          const trialStartDate = new Date();
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);

          const { data: newWorkspace, error: createError } = await supabase
            .from('workspaces')
            .insert({
              name: `${displayName}'s Workspace`,
              slug: slug,
              plan: 'free',
              max_team_members: 3,
              max_creators: 25,
              max_storage_gb: 5,
              subscription_status: 'trialing',
              trial_started_at: trialStartDate.toISOString(),
              trial_ends_at: trialEndDate.toISOString(),
              features: {
                revenue_tracking: false,
                advanced_analytics: false,
                team_collaboration: true,
                priority_support: false,
                task_assignment: false,
              },
              owner_id: user.id,
            })
            .select()
            .single();

          if (createError) {
            console.error('[DASHBOARD] Error creating workspace:', createError);
            setWorkspace(null);
            return;
          }

          console.log('[DASHBOARD] New workspace created:', newWorkspace.id);
          resolvedWorkspace = newWorkspace as Workspace;
        } else {
          // Bestaande owner-workspace + naam-update logica
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData?.full_name) {
            const displayName = profileData.full_name;
            const expectedWorkspaceName = `${displayName}'s Workspace`;

            if (workspaceData.name !== expectedWorkspaceName && workspaceData.name.includes('@')) {
              const { data: updatedWorkspace } = await supabase
                .from('workspaces')
                .update({ name: expectedWorkspaceName })
                .eq('id', workspaceData.id)
                .select()
                .single();

              resolvedWorkspace = (updatedWorkspace || workspaceData) as Workspace;
            } else {
              resolvedWorkspace = workspaceData as Workspace;
            }
          } else {
            resolvedWorkspace = workspaceData as Workspace;
          }
        }
      }

      setWorkspace(resolvedWorkspace);
    } catch (err) {
      console.error('[DASHBOARD] Unexpected error in loadWorkspace:', err);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  };
