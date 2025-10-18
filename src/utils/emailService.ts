import { supabase } from '../lib/supabase';

interface SendEmailParams {
  template_slug: string;
  recipient_email: string;
  recipient_name?: string;
  workspace_id?: string;
  user_id?: string;
  variables: Record<string, string>;
  priority?: number;
  scheduled_for?: string;
}

export const emailService = {
  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string; message_id?: string }> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Email sending failed:', error);
        return { success: false, error: error.message || 'Failed to send email' };
      }

      const data = await response.json();
      return { success: true, message_id: data.message_id };
    } catch (error: any) {
      console.error('Email service error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  },

  async sendWelcomeEmail(userId: string, userEmail: string, userName: string) {
    return this.sendEmail({
      template_slug: 'welcome',
      recipient_email: userEmail,
      recipient_name: userName,
      user_id: userId,
      variables: {
        user_name: userName,
        dashboard_url: `${window.location.origin}/dashboard`,
      },
      priority: 8,
    });
  },

  async sendPasswordResetEmail(userEmail: string, resetUrl: string) {
    return this.sendEmail({
      template_slug: 'password-reset',
      recipient_email: userEmail,
      variables: {
        reset_url: resetUrl,
      },
      priority: 9,
    });
  },

  async sendSupportTicketCreated(ticketData: {
    user_name: string;
    user_email: string;
    user_id: string;
    workspace_id?: string;
    ticket_number: string;
    subject: string;
    message: string;
    priority: string;
    ticket_url: string;
  }) {
    const responseTimeMap: Record<string, string> = {
      urgent: '4-8 hours',
      high: '12-24 hours',
      medium: '24-48 hours',
      low: '2-3 business days',
    };

    return this.sendEmail({
      template_slug: 'support-ticket-created',
      recipient_email: ticketData.user_email,
      recipient_name: ticketData.user_name,
      user_id: ticketData.user_id,
      workspace_id: ticketData.workspace_id,
      variables: {
        user_name: ticketData.user_name,
        ticket_number: ticketData.ticket_number,
        subject: ticketData.subject,
        message: ticketData.message,
        priority: ticketData.priority,
        ticket_url: ticketData.ticket_url,
        response_time: responseTimeMap[ticketData.priority] || '24-48 hours',
      },
      priority: ticketData.priority === 'urgent' ? 10 : 7,
    });
  },

  async sendSupportTicketReply(replyData: {
    user_email: string;
    user_name: string;
    user_id: string;
    workspace_id?: string;
    ticket_number: string;
    support_name: string;
    reply_message: string;
    ticket_url: string;
  }) {
    return this.sendEmail({
      template_slug: 'support-ticket-reply',
      recipient_email: replyData.user_email,
      recipient_name: replyData.user_name,
      user_id: replyData.user_id,
      workspace_id: replyData.workspace_id,
      variables: {
        support_name: replyData.support_name,
        ticket_number: replyData.ticket_number,
        reply_message: replyData.reply_message,
        ticket_url: replyData.ticket_url,
      },
      priority: 8,
    });
  },

  async sendSupportTicketResolved(ticketData: {
    user_email: string;
    user_name: string;
    user_id: string;
    workspace_id?: string;
    ticket_number: string;
    ticket_url: string;
  }) {
    return this.sendEmail({
      template_slug: 'support-ticket-resolved',
      recipient_email: ticketData.user_email,
      recipient_name: ticketData.user_name,
      user_id: ticketData.user_id,
      workspace_id: ticketData.workspace_id,
      variables: {
        ticket_number: ticketData.ticket_number,
        ticket_url: ticketData.ticket_url,
      },
      priority: 5,
    });
  },

  async sendTrialStarted(userData: {
    user_email: string;
    user_name: string;
    user_id: string;
    workspace_id: string;
    trial_end_date: string;
  }) {
    return this.sendEmail({
      template_slug: 'trial-started',
      recipient_email: userData.user_email,
      recipient_name: userData.user_name,
      user_id: userData.user_id,
      workspace_id: userData.workspace_id,
      variables: {
        trial_end_date: userData.trial_end_date,
        dashboard_url: `${window.location.origin}/dashboard`,
      },
      priority: 7,
    });
  },

  async sendTrialExpiringSoon(userData: {
    user_email: string;
    user_name: string;
    user_id: string;
    workspace_id: string;
    days_left: string;
    trial_end_date: string;
  }) {
    return this.sendEmail({
      template_slug: 'trial-expiring-soon',
      recipient_email: userData.user_email,
      recipient_name: userData.user_name,
      user_id: userData.user_id,
      workspace_id: userData.workspace_id,
      variables: {
        user_name: userData.user_name,
        days_left: userData.days_left,
        trial_end_date: userData.trial_end_date,
        upgrade_url: `${window.location.origin}/dashboard?view=settings`,
      },
      priority: 9,
    });
  },

  async sendPaymentSuccess(paymentData: {
    user_email: string;
    user_name: string;
    user_id: string;
    workspace_id: string;
    plan_name: string;
    amount: string;
    payment_date: string;
    next_billing_date: string;
    invoice_number: string;
    invoice_url: string;
  }) {
    return this.sendEmail({
      template_slug: 'payment-success',
      recipient_email: paymentData.user_email,
      recipient_name: paymentData.user_name,
      user_id: paymentData.user_id,
      workspace_id: paymentData.workspace_id,
      variables: {
        plan_name: paymentData.plan_name,
        amount: paymentData.amount,
        payment_date: paymentData.payment_date,
        next_billing_date: paymentData.next_billing_date,
        invoice_number: paymentData.invoice_number,
        invoice_url: paymentData.invoice_url,
      },
      priority: 6,
    });
  },

  async sendPaymentFailed(paymentData: {
    user_email: string;
    user_name: string;
    user_id: string;
    workspace_id: string;
    plan_name: string;
  }) {
    return this.sendEmail({
      template_slug: 'payment-failed',
      recipient_email: paymentData.user_email,
      recipient_name: paymentData.user_name,
      user_id: paymentData.user_id,
      workspace_id: paymentData.workspace_id,
      variables: {
        plan_name: paymentData.plan_name,
        payment_url: `${window.location.origin}/dashboard?view=settings`,
      },
      priority: 10,
    });
  },

  async sendTeamInvitation(inviteData: {
    recipient_email: string;
    recipient_name: string;
    workspace_id: string;
    inviter_name: string;
    workspace_name: string;
    role: string;
    accept_url: string;
  }) {
    return this.sendEmail({
      template_slug: 'team-invitation',
      recipient_email: inviteData.recipient_email,
      recipient_name: inviteData.recipient_name,
      workspace_id: inviteData.workspace_id,
      variables: {
        inviter_name: inviteData.inviter_name,
        workspace_name: inviteData.workspace_name,
        role: inviteData.role,
        accept_url: inviteData.accept_url,
      },
      priority: 8,
    });
  },

  async sendCampaignStarted(campaignData: {
    user_email: string;
    user_name: string;
    user_id: string;
    workspace_id: string;
    campaign_name: string;
    start_date: string;
    end_date: string;
    budget: string;
    creator_count: string;
    campaign_url: string;
  }) {
    return this.sendEmail({
      template_slug: 'campaign-started',
      recipient_email: campaignData.user_email,
      recipient_name: campaignData.user_name,
      user_id: campaignData.user_id,
      workspace_id: campaignData.workspace_id,
      variables: {
        campaign_name: campaignData.campaign_name,
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
        budget: campaignData.budget,
        creator_count: campaignData.creator_count,
        campaign_url: campaignData.campaign_url,
      },
      priority: 6,
    });
  },

  async sendTaskAssigned(taskData: {
    user_email: string;
    user_name: string;
    user_id: string;
    workspace_id: string;
    assigner_name: string;
    task_title: string;
    task_description: string;
    priority: string;
    due_date: string;
    task_url: string;
  }) {
    return this.sendEmail({
      template_slug: 'task-assigned',
      recipient_email: taskData.user_email,
      recipient_name: taskData.user_name,
      user_id: taskData.user_id,
      workspace_id: taskData.workspace_id,
      variables: {
        assigner_name: taskData.assigner_name,
        task_title: taskData.task_title,
        task_description: taskData.task_description,
        priority: taskData.priority,
        due_date: taskData.due_date,
        task_url: taskData.task_url,
      },
      priority: taskData.priority === 'urgent' ? 9 : 6,
    });
  },

  async sendWeeklyDigest(digestData: {
    user_email: string;
    user_name: string;
    user_id: string;
    workspace_id: string;
    week_start: string;
    week_end: string;
    campaign_count: string;
    new_creators: string;
    content_count: string;
    tasks_completed: string;
  }) {
    return this.sendEmail({
      template_slug: 'weekly-digest',
      recipient_email: digestData.user_email,
      recipient_name: digestData.user_name,
      user_id: digestData.user_id,
      workspace_id: digestData.workspace_id,
      variables: {
        week_start: digestData.week_start,
        week_end: digestData.week_end,
        campaign_count: digestData.campaign_count,
        new_creators: digestData.new_creators,
        content_count: digestData.content_count,
        tasks_completed: digestData.tasks_completed,
        dashboard_url: `${window.location.origin}/dashboard`,
        unsubscribe_url: `${window.location.origin}/dashboard?view=settings&tab=email`,
      },
      priority: 3,
    });
  },
};
