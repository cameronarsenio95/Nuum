export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          plan: 'free' | 'standard' | 'elite' | 'enterprise'
          max_team_members: number | null
          max_creators: number | null
          max_storage_gb: number | null
          storage_used_bytes: number
          subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired'
          subscription_expires_at: string | null
          features: Json
          owner_id: string
          settings: Json
          support_metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: 'free' | 'standard' | 'elite' | 'enterprise'
          max_team_members?: number | null
          max_creators?: number | null
          max_storage_gb?: number | null
          storage_used_bytes?: number
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired'
          subscription_expires_at?: string | null
          features?: Json
          owner_id: string
          settings?: Json
          support_metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: 'free' | 'standard' | 'elite' | 'enterprise'
          max_team_members?: number | null
          max_creators?: number | null
          max_storage_gb?: number | null
          storage_used_bytes?: number
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired'
          subscription_expires_at?: string | null
          features?: Json
          owner_id?: string
          settings?: Json
          support_metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          invited_by: string | null
          joined_at: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          invited_by?: string | null
          joined_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          invited_by?: string | null
          joined_at?: string
          created_at?: string
        }
      }
      creators: {
        Row: {
          id: string
          workspace_id: string
          name: string
          email: string | null
          phone: string | null
          instagram_handle: string | null
          tiktok_handle: string | null
          youtube_handle: string | null
          follower_count: Json
          engagement_rate: number | null
          notes: string | null
          tags: string[]
          status: 'active' | 'inactive' | 'blacklisted'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          email?: string | null
          phone?: string | null
          instagram_handle?: string | null
          tiktok_handle?: string | null
          youtube_handle?: string | null
          follower_count?: Json
          engagement_rate?: number | null
          notes?: string | null
          tags?: string[]
          status?: 'active' | 'inactive' | 'blacklisted'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          instagram_handle?: string | null
          tiktok_handle?: string | null
          youtube_handle?: string | null
          follower_count?: Json
          engagement_rate?: number | null
          notes?: string | null
          tags?: string[]
          status?: 'active' | 'inactive' | 'blacklisted'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          status: 'draft' | 'active' | 'completed' | 'archived'
          budget: number | null
          start_date: string | null
          end_date: string | null
          goals: Json
          brand_guidelines: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          total_ad_sets: number
          active_ad_sets: number
          total_spend: number
          total_revenue: number
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'active' | 'completed' | 'archived'
          budget?: number | null
          start_date?: string | null
          end_date?: string | null
          goals?: Json
          brand_guidelines?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          total_ad_sets?: number
          active_ad_sets?: number
          total_spend?: number
          total_revenue?: number
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          status?: 'draft' | 'active' | 'completed' | 'archived'
          budget?: number | null
          start_date?: string | null
          end_date?: string | null
          goals?: Json
          brand_guidelines?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          total_ad_sets?: number
          active_ad_sets?: number
          total_spend?: number
          total_revenue?: number
        }
      }
      ad_sets: {
        Row: {
          id: string
          campaign_id: string
          creator_id: string
          name: string
          description: string | null
          platform: 'META' | 'TikTok' | 'Google' | 'YouTube' | 'Other'
          status: 'active' | 'paused' | 'completed' | 'draft'
          budget: number | null
          revenue: number
          spend: number
          impressions: number
          clicks: number
          conversions: number
          ctr: number
          ad_creative_url: string | null
          targeting_data: Json
          performance_metrics: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          creator_id: string
          name: string
          description?: string | null
          platform: 'META' | 'TikTok' | 'Google' | 'YouTube' | 'Other'
          status?: 'active' | 'paused' | 'completed' | 'draft'
          budget?: number | null
          revenue?: number
          spend?: number
          impressions?: number
          clicks?: number
          conversions?: number
          ctr?: number
          ad_creative_url?: string | null
          targeting_data?: Json
          performance_metrics?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          creator_id?: string
          name?: string
          description?: string | null
          platform?: 'META' | 'TikTok' | 'Google' | 'YouTube' | 'Other'
          status?: 'active' | 'paused' | 'completed' | 'draft'
          budget?: number | null
          revenue?: number
          spend?: number
          impressions?: number
          clicks?: number
          conversions?: number
          ctr?: number
          ad_creative_url?: string | null
          targeting_data?: Json
          performance_metrics?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          workspace_id: string
          campaign_id: string | null
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'review' | 'done'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string | null
          due_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          campaign_id?: string | null
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          due_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          campaign_id?: string | null
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          due_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deliverables: {
        Row: {
          id: string
          campaign_id: string
          creator_id: string
          campaign_creator_id: string | null
          title: string
          description: string | null
          type: 'post' | 'story' | 'video' | 'reel' | 'other'
          platform: 'instagram' | 'tiktok' | 'youtube' | 'other'
          due_date: string | null
          status: 'pending' | 'in_review' | 'approved' | 'posted' | 'completed'
          url: string | null
          performance_data: Json
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          creator_id: string
          campaign_creator_id?: string | null
          title: string
          description?: string | null
          type?: 'post' | 'story' | 'video' | 'reel' | 'other'
          platform?: 'instagram' | 'tiktok' | 'youtube' | 'other'
          due_date?: string | null
          status?: 'pending' | 'in_review' | 'approved' | 'posted' | 'completed'
          url?: string | null
          performance_data?: Json
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          creator_id?: string
          campaign_creator_id?: string | null
          title?: string
          description?: string | null
          type?: 'post' | 'story' | 'video' | 'reel' | 'other'
          platform?: 'instagram' | 'tiktok' | 'youtube' | 'other'
          due_date?: string | null
          status?: 'pending' | 'in_review' | 'approved' | 'posted' | 'completed'
          url?: string | null
          performance_data?: Json
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          workspace_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string
          details?: Json | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          type: 'mention' | 'assignment' | 'deadline' | 'comment' | 'status_change'
          title: string
          message: string
          entity_type: string | null
          entity_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          type: 'mention' | 'assignment' | 'deadline' | 'comment' | 'status_change'
          title: string
          message: string
          entity_type?: string | null
          entity_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string | null
          type?: 'mention' | 'assignment' | 'deadline' | 'comment' | 'status_change'
          title?: string
          message?: string
          entity_type?: string | null
          entity_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          company: string | null
          job_title: string | null
          bio: string | null
          avatar_url: string | null
          timezone: string
          language: string
          notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          company?: string | null
          job_title?: string | null
          bio?: string | null
          avatar_url?: string | null
          timezone?: string
          language?: string
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          company?: string | null
          job_title?: string | null
          bio?: string | null
          avatar_url?: string | null
          timezone?: string
          language?: string
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_intelligence_suggestions: {
        Row: {
          id: string
          workspace_id: string
          title: string
          description: string
          ai_reasoning: string
          status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          category: string | null
          tags: string[]
          related_to: Json
          duplicate_of: string | null
          metadata: Json
          accepted_by: string | null
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          description: string
          ai_reasoning: string
          status?: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          category?: string | null
          tags?: string[]
          related_to?: Json
          duplicate_of?: string | null
          metadata?: Json
          accepted_by?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          description?: string
          ai_reasoning?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          category?: string | null
          tags?: string[]
          related_to?: Json
          duplicate_of?: string | null
          metadata?: Json
          accepted_by?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      linear_integrations: {
        Row: {
          id: string
          workspace_id: string
          linear_team_id: string
          linear_team_name: string
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          mcp_config: Json
          sync_enabled: boolean
          last_sync_at: string | null
          sync_status: 'idle' | 'syncing' | 'error' | 'paused'
          sync_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          linear_team_id: string
          linear_team_name: string
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          mcp_config?: Json
          sync_enabled?: boolean
          last_sync_at?: string | null
          sync_status?: 'idle' | 'syncing' | 'error' | 'paused'
          sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          linear_team_id?: string
          linear_team_name?: string
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          mcp_config?: Json
          sync_enabled?: boolean
          last_sync_at?: string | null
          sync_status?: 'idle' | 'syncing' | 'error' | 'paused'
          sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      linear_issues: {
        Row: {
          id: string
          workspace_id: string
          linear_id: string
          linear_identifier: string
          title: string
          description: string | null
          state: string
          state_id: string | null
          priority: number
          priority_label: string | null
          project_id: string | null
          team_id: string | null
          assignee_id: string | null
          creator_id: string | null
          labels: Json
          url: string | null
          cycle_id: string | null
          estimate: number | null
          started_at: string | null
          completed_at: string | null
          canceled_at: string | null
          due_date: string | null
          linear_created_at: string | null
          linear_updated_at: string | null
          local_created_at: string
          local_updated_at: string
          sync_status: 'synced' | 'pending' | 'conflict' | 'error'
        }
        Insert: {
          id?: string
          workspace_id: string
          linear_id: string
          linear_identifier: string
          title: string
          description?: string | null
          state: string
          state_id?: string | null
          priority?: number
          priority_label?: string | null
          project_id?: string | null
          team_id?: string | null
          assignee_id?: string | null
          creator_id?: string | null
          labels?: Json
          url?: string | null
          cycle_id?: string | null
          estimate?: number | null
          started_at?: string | null
          completed_at?: string | null
          canceled_at?: string | null
          due_date?: string | null
          linear_created_at?: string | null
          linear_updated_at?: string | null
          local_created_at?: string
          local_updated_at?: string
          sync_status?: 'synced' | 'pending' | 'conflict' | 'error'
        }
        Update: {
          id?: string
          workspace_id?: string
          linear_id?: string
          linear_identifier?: string
          title?: string
          description?: string | null
          state?: string
          state_id?: string | null
          priority?: number
          priority_label?: string | null
          project_id?: string | null
          team_id?: string | null
          assignee_id?: string | null
          creator_id?: string | null
          labels?: Json
          url?: string | null
          cycle_id?: string | null
          estimate?: number | null
          started_at?: string | null
          completed_at?: string | null
          canceled_at?: string | null
          due_date?: string | null
          linear_created_at?: string | null
          linear_updated_at?: string | null
          local_created_at?: string
          local_updated_at?: string
          sync_status?: 'synced' | 'pending' | 'conflict' | 'error'
        }
      }
      integration_sync_logs: {
        Row: {
          id: string
          workspace_id: string
          integration_type: string
          sync_type: 'full' | 'delta' | 'webhook' | 'manual'
          direction: 'inbound' | 'outbound' | 'bidirectional'
          status: 'started' | 'in_progress' | 'completed' | 'failed' | 'partial'
          records_processed: number
          records_created: number
          records_updated: number
          records_failed: number
          error_message: string | null
          error_details: Json | null
          metadata: Json
          started_at: string
          completed_at: string | null
          duration_ms: number | null
        }
        Insert: {
          id?: string
          workspace_id: string
          integration_type?: string
          sync_type: 'full' | 'delta' | 'webhook' | 'manual'
          direction: 'inbound' | 'outbound' | 'bidirectional'
          status: 'started' | 'in_progress' | 'completed' | 'failed' | 'partial'
          records_processed?: number
          records_created?: number
          records_updated?: number
          records_failed?: number
          error_message?: string | null
          error_details?: Json | null
          metadata?: Json
          started_at?: string
          completed_at?: string | null
          duration_ms?: number | null
        }
        Update: {
          id?: string
          workspace_id?: string
          integration_type?: string
          sync_type?: 'full' | 'delta' | 'webhook' | 'manual'
          direction?: 'inbound' | 'outbound' | 'bidirectional'
          status?: 'started' | 'in_progress' | 'completed' | 'failed' | 'partial'
          records_processed?: number
          records_created?: number
          records_updated?: number
          records_failed?: number
          error_message?: string | null
          error_details?: Json | null
          metadata?: Json
          started_at?: string
          completed_at?: string | null
          duration_ms?: number | null
        }
      }
      support_staff: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'support_viewer' | 'support_agent' | 'support_admin'
          is_active: boolean
          permissions: Json
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'support_viewer' | 'support_agent' | 'support_admin'
          is_active?: boolean
          permissions?: Json
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'support_viewer' | 'support_agent' | 'support_admin'
          is_active?: boolean
          permissions?: Json
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      support_audit_logs: {
        Row: {
          id: string
          staff_id: string | null
          staff_email: string
          staff_name: string
          action_type: 'view_customer' | 'view_workspace' | 'modify_plan' | 'modify_subscription' | 'modify_limits' | 'modify_features' | 'modify_user' | 'delete_data' | 'reset_password' | 'extend_trial' | 'add_note' | 'impersonate_start' | 'impersonate_end' | 'export_data' | 'bulk_operation'
          entity_type: 'workspace' | 'user' | 'profile' | 'subscription' | 'creator' | 'campaign' | 'team_member' | 'workspace_settings' | 'feature_flags'
          entity_id: string | null
          customer_email: string | null
          workspace_id: string | null
          workspace_name: string | null
          action_details: Json
          previous_state: Json | null
          new_state: Json | null
          ip_address: string | null
          user_agent: string | null
          ticket_reference: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id?: string | null
          staff_email: string
          staff_name: string
          action_type: 'view_customer' | 'view_workspace' | 'modify_plan' | 'modify_subscription' | 'modify_limits' | 'modify_features' | 'modify_user' | 'delete_data' | 'reset_password' | 'extend_trial' | 'add_note' | 'impersonate_start' | 'impersonate_end' | 'export_data' | 'bulk_operation'
          entity_type: 'workspace' | 'user' | 'profile' | 'subscription' | 'creator' | 'campaign' | 'team_member' | 'workspace_settings' | 'feature_flags'
          entity_id?: string | null
          customer_email?: string | null
          workspace_id?: string | null
          workspace_name?: string | null
          action_details?: Json
          previous_state?: Json | null
          new_state?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          ticket_reference?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string | null
          staff_email?: string
          staff_name?: string
          action_type?: 'view_customer' | 'view_workspace' | 'modify_plan' | 'modify_subscription' | 'modify_limits' | 'modify_features' | 'modify_user' | 'delete_data' | 'reset_password' | 'extend_trial' | 'add_note' | 'impersonate_start' | 'impersonate_end' | 'export_data' | 'bulk_operation'
          entity_type?: 'workspace' | 'user' | 'profile' | 'subscription' | 'creator' | 'campaign' | 'team_member' | 'workspace_settings' | 'feature_flags'
          entity_id?: string | null
          customer_email?: string | null
          workspace_id?: string | null
          workspace_name?: string | null
          action_details?: Json
          previous_state?: Json | null
          new_state?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          ticket_reference?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      support_sessions: {
        Row: {
          id: string
          staff_id: string
          session_token: string
          impersonating_user_id: string | null
          impersonating_workspace_id: string | null
          started_at: string
          expires_at: string
          last_activity_at: string
          ended_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          staff_id: string
          session_token: string
          impersonating_user_id?: string | null
          impersonating_workspace_id?: string | null
          started_at?: string
          expires_at: string
          last_activity_at?: string
          ended_at?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          staff_id?: string
          session_token?: string
          impersonating_user_id?: string | null
          impersonating_workspace_id?: string | null
          started_at?: string
          expires_at?: string
          last_activity_at?: string
          ended_at?: string | null
          metadata?: Json
        }
      }
      support_workspace_notes: {
        Row: {
          id: string
          workspace_id: string
          staff_id: string | null
          staff_name: string
          note_type: 'general' | 'warning' | 'billing' | 'technical' | 'escalation'
          content: string
          is_pinned: boolean
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          staff_id?: string | null
          staff_name: string
          note_type?: 'general' | 'warning' | 'billing' | 'technical' | 'escalation'
          content: string
          is_pinned?: boolean
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          staff_id?: string | null
          staff_name?: string
          note_type?: 'general' | 'warning' | 'billing' | 'technical' | 'escalation'
          content?: string
          is_pinned?: boolean
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
