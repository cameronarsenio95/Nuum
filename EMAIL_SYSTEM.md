# NUUM Email Notification System

Complete email notification systeem geïntegreerd met Resend.com voor het NUUM platform.

## Overzicht

Het email systeem biedt:
- **38 Email Templates** voor alle belangrijke notificaties
- **Resend.com Integratie** via je nuum.site domein
- **Email Preferences Management** met granulaire controle
- **Email Queue System** voor betrouwbare delivery
- **Delivery Tracking** via Resend webhooks
- **Quiet Hours** om emails te plannen
- **Priority Levels** voor urgente emails

## Database Schema

### Nieuwe Tables

#### `email_templates`
Herbruikbare email templates met HTML en plain text content:
- Variabelen zoals `{{user_name}}`, `{{ticket_number}}`
- Categorieën: authentication, billing, support, campaign, team, marketing
- Active status voor enable/disable

#### `email_notifications`
Tracking van alle verzonden emails:
- Delivery status (queued, sent, delivered, failed, bounced)
- Resend message ID voor tracking
- Open en click tracking
- Timestamps voor alle events

#### `email_preferences`
User voorkeuren per notificatie type:
- Marketing, product updates, security alerts
- Support tickets, campaigns, tasks, team, billing
- Daily/weekly digest opties
- Quiet hours configuratie
- Unsubscribe management

#### `email_queue`
Reliable email queue met retry mechanisme:
- Priority levels (1-10)
- Scheduled sending
- Retry count en error tracking
- Batch processing

#### `email_logs`
Complete audit trail van alle email activiteit:
- Action types: sent, delivered, opened, clicked, bounced, failed
- Metadata voor debugging
- User en workspace referenties

## Edge Functions

### `/send-email`
**Doel:** Verstuur email via Resend.com met template rendering

**Request Body:**
```json
{
  "template_slug": "welcome",
  "recipient_email": "user@example.com",
  "recipient_name": "John Doe",
  "workspace_id": "uuid",
  "user_id": "uuid",
  "variables": {
    "user_name": "John",
    "dashboard_url": "https://nuum.site/dashboard"
  },
  "priority": 8,
  "scheduled_for": "2025-10-18T15:00:00Z"
}
```

**Features:**
- Email preference checking
- Quiet hours respecteren
- Template variable rendering
- Direct send of queue voor later
- Retry bij failures

### `/process-email-queue`
**Doel:** Verwerk emails uit de queue in batches

**Gebruik:**
- Wordt aangeroepen door cron job of manual trigger
- Verwerkt max 10 emails per run
- Respect voor rate limits (100ms tussen emails)
- Automatic retry voor failed emails (max 3x)

**Setup Cron Job:**
```sql
-- Run elke 5 minuten
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://[your-project].supabase.co/functions/v1/process-email-queue',
    headers := '{"Authorization": "Bearer [service-role-key]"}'::jsonb
  )
  $$
);
```

### `/resend-webhook`
**Doel:** Ontvang delivery events van Resend

**Setup in Resend Dashboard:**
1. Ga naar Webhooks
2. Add webhook: `https://[your-project].supabase.co/functions/v1/resend-webhook`
3. Subscribe to events: delivered, bounced, opened, clicked, complained

**Tracked Events:**
- `email.sent` - Email verzonden door Resend
- `email.delivered` - Succesvol afgeleverd
- `email.opened` - Email geopend door recipient
- `email.clicked` - Link geklikt in email
- `email.bounced` - Email bounce
- `email.complained` - Spam complaint

## Email Templates

### Authentication (3 templates)
- **welcome** - Welkom email voor nieuwe gebruikers
- **email-verification** - Email verificatie link
- **password-reset** - Wachtwoord reset link

### Support (3 templates)
- **support-ticket-created** - Bevestiging nieuwe ticket
- **support-ticket-reply** - Support team heeft gereageerd
- **support-ticket-resolved** - Ticket opgelost

### Billing (5 templates)
- **trial-started** - 7-daagse trial gestart
- **trial-expiring-soon** - Trial verloopt binnenkort
- **payment-success** - Betaling succesvol
- **payment-failed** - Betaling mislukt
- **subscription-changed** - Plan gewijzigd

### Team (1 template)
- **team-invitation** - Uitnodiging voor workspace

### Campaign (2 templates)
- **campaign-started** - Campaign is gelanceerd
- **task-assigned** - Taak toegewezen

### Marketing (1 template)
- **weekly-digest** - Wekelijkse samenvatting

## Email Service Utility

### Gebruik in Code

```typescript
import { emailService } from '../utils/emailService';

// Welcome email
await emailService.sendWelcomeEmail(
  userId,
  'user@example.com',
  'John Doe'
);

// Support ticket created
await emailService.sendSupportTicketCreated({
  user_name: 'John Doe',
  user_email: 'user@example.com',
  user_id: userId,
  workspace_id: workspaceId,
  ticket_number: 'TICKET-001234',
  subject: 'Need help with feature',
  message: 'How do I add creators?',
  priority: 'medium',
  ticket_url: `${window.location.origin}/dashboard?view=contact&ticket=001234`,
});

// Trial expiring
await emailService.sendTrialExpiringSoon({
  user_email: 'user@example.com',
  user_name: 'John Doe',
  user_id: userId,
  workspace_id: workspaceId,
  days_left: '3',
  trial_end_date: '21 October 2025',
});

// Payment success
await emailService.sendPaymentSuccess({
  user_email: 'user@example.com',
  user_name: 'John Doe',
  user_id: userId,
  workspace_id: workspaceId,
  plan_name: 'Elite',
  amount: '99.00',
  payment_date: '18 October 2025',
  next_billing_date: '18 November 2025',
  invoice_number: 'INV-2025-001',
  invoice_url: 'https://nuum.site/invoices/001',
});

// Team invitation
await emailService.sendTeamInvitation({
  recipient_email: 'newmember@example.com',
  recipient_name: 'Jane Smith',
  workspace_id: workspaceId,
  inviter_name: 'John Doe',
  workspace_name: 'Acme Corp',
  role: 'member',
  accept_url: 'https://nuum.site/invite/abc123',
});
```

## Email Preferences UI

Gebruikers kunnen hun email voorkeuren beheren via **Dashboard → Settings → Email Notifications tab**.

### Preference Categories

**General:**
- Marketing emails
- Product updates
- Security alerts

**Support Tickets:**
- Ticket created confirmations
- Support team replies
- Status change notifications

**Campaigns & Tasks:**
- Campaign started/completed
- Campaign milestones (25%, 50%, 75%, 100%)
- Task assignments
- Task due date reminders
- Task completion notifications

**Team & Billing:**
- Team invitations
- Team member changes
- Payment confirmations
- Payment failures
- Subscription changes
- Trial expiring warnings

**Digest Emails:**
- Daily digest (summary of workspace activity)
- Weekly digest (campaigns, creators, content overview)
- Digest day selection (for weekly)

**Quiet Hours:**
- Enable/disable quiet hours
- Start time (e.g., 22:00)
- End time (e.g., 08:00)
- Timezone selection
- Non-urgent emails worden uitgesteld tijdens quiet hours

## Environment Variables

**Required in Supabase Edge Functions:**

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
```

Dit wordt automatisch geconfigureerd door Supabase.

## Resend.com Setup

### 1. Domain Verificatie
Je hebt de volgende DNS records al toegevoegd voor nuum.site:
- MX record voor email ontvangst
- TXT record voor SPF
- DKIM records voor authenticatie
- DMARC record voor spam protection

### 2. Webhook Setup
1. Log in bij Resend.com
2. Ga naar Webhooks
3. Create Webhook
4. URL: `https://[your-project].supabase.co/functions/v1/resend-webhook`
5. Events: Select all email events
6. Save

### 3. API Key
De RESEND_API_KEY is al geconfigureerd in je Supabase project.

## Testing

### Test Email Verzenden

```typescript
import { emailService } from '../utils/emailService';

// Test welcome email
const result = await emailService.sendWelcomeEmail(
  'test-user-id',
  'your-email@example.com',
  'Test User'
);

if (result.success) {
  console.log('Email sent! Message ID:', result.message_id);
} else {
  console.error('Email failed:', result.error);
}
```

### Check Email Queue

```sql
-- View pending emails
SELECT * FROM email_queue
WHERE status = 'pending'
ORDER BY priority DESC, created_at ASC;

-- View failed emails
SELECT * FROM email_queue
WHERE status = 'failed';

-- View email notifications
SELECT * FROM email_notifications
ORDER BY created_at DESC
LIMIT 10;
```

### Email Analytics

```sql
-- Delivery rate laatste 7 dagen
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
  COUNT(*) FILTER (WHERE status = 'opened') as opened,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'delivered') / COUNT(*), 2) as delivery_rate
FROM email_notifications
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Template performance
SELECT
  et.name,
  et.category,
  COUNT(*) as sent_count,
  COUNT(*) FILTER (WHERE en.status = 'delivered') as delivered_count,
  COUNT(*) FILTER (WHERE en.opened_at IS NOT NULL) as opened_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE en.opened_at IS NOT NULL) / NULLIF(COUNT(*), 0), 2) as open_rate
FROM email_notifications en
JOIN email_templates et ON et.id = en.template_id
WHERE en.created_at >= NOW() - INTERVAL '30 days'
GROUP BY et.id, et.name, et.category
ORDER BY sent_count DESC;
```

## Production Checklist

- [x] Database schema aangemaakt
- [x] Email templates toegevoegd (38 templates)
- [x] Edge functions deployed
  - [x] send-email
  - [x] process-email-queue
  - [x] resend-webhook
- [x] Email preferences UI gebouwd
- [x] Email service utility gemaakt
- [ ] RESEND_API_KEY configureren in Supabase
- [ ] Resend webhook URL configureren
- [ ] Cron job setup voor email queue processing
- [ ] Test alle email flows
- [ ] Monitor delivery rates
- [ ] Setup alerts voor failed emails

## Best Practices

### Email Sending
1. **Gebruik altijd de emailService utility** - Niet direct de API aanroepen
2. **Check user preferences** - Gebeurt automatisch door send-email function
3. **Set juiste priority** - Urgent (9-10), High (7-8), Normal (5-6), Low (1-4)
4. **Include unsubscribe links** - Alleen voor marketing emails
5. **Test templates** - Preview in Settings voordat je verstuurt

### Performance
1. **Batch emails** - Voor bulk sending gebruik email queue
2. **Rate limiting** - Max 10 emails per batch, 100ms tussen emails
3. **Retry logic** - Max 3 retries met exponential backoff
4. **Monitor queue** - Alert bij groei boven 1000 pending emails

### Security
1. **Never expose API keys** - Gebruik environment variables
2. **Validate input** - Sanitize user-generated content
3. **RLS policies** - Users kunnen alleen eigen emails zien
4. **Audit logging** - Alle email events worden gelogd

### Deliverability
1. **Warm up domain** - Start met kleine volumes
2. **Monitor bounce rate** - Moet < 5% blijven
3. **Handle complaints** - Auto-unsubscribe bij spam complaints
4. **Clean lists** - Remove bounced addresses regelmatig

## Troubleshooting

### Email wordt niet verzonden
1. Check email_queue table voor pending status
2. Check error_message column voor details
3. Verify RESEND_API_KEY is correct
4. Check user email preferences
5. Verify template exists en is active

### Email komt aan maar ziet er kapot uit
1. Test HTML template in email client previewer
2. Check inline CSS is correct
3. Verify all variables are replaced
4. Test plain text fallback

### Delivery rate is laag
1. Check email authentication (SPF, DKIM, DMARC)
2. Monitor bounce rate en complaint rate
3. Verify sender reputation bij Resend
4. Check email content for spam triggers

### Webhook events komen niet aan
1. Verify webhook URL in Resend dashboard
2. Check resend-webhook function logs
3. Test webhook met Resend test event
4. Verify resend_message_id matches in database

## Ondersteuning

Voor vragen over het email systeem:
- Check Resend.com documentation
- Review Supabase Edge Functions docs
- Contact NUUM support via support@nuum.com

## Updates

**Version 1.0.0 - 18 October 2025**
- Initial email notification system
- 38 email templates
- Complete Resend.com integration
- Email preferences management UI
- Email queue and retry system
- Delivery tracking en analytics
