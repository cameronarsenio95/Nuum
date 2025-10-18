/*
  # Email Domains and DNS Records Management

  1. New Tables
    - `email_domains`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, references workspaces)
      - `domain` (text, the domain name like "nuum.site")
      - `region` (text, email sending region like "us-east-1")
      - `status` (text, verification status: pending, verified, failed)
      - `provider` (text, email provider: resend, ses, etc)
      - `verified_at` (timestamptz, when domain was verified)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `dns_records`
      - `id` (uuid, primary key)
      - `email_domain_id` (uuid, references email_domains)
      - `record_type` (text, DNS record type: MX, TXT, CNAME)
      - `host` (text, host/name like "send" or "_dmarc")
      - `value` (text, DNS record value)
      - `priority` (integer, for MX records)
      - `ttl` (integer, time to live)
      - `purpose` (text, what the record is for: spf, dkim, dmarc, mx)
      - `verified` (boolean, whether DNS record is verified)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for workspace members to manage their domains
*/

-- Create email_domains table
CREATE TABLE IF NOT EXISTS email_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  domain text NOT NULL,
  region text DEFAULT 'us-east-1',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  provider text DEFAULT 'resend' CHECK (provider IN ('resend', 'ses', 'sendgrid', 'mailgun')),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, domain)
);

-- Create dns_records table
CREATE TABLE IF NOT EXISTS dns_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_domain_id uuid REFERENCES email_domains(id) ON DELETE CASCADE NOT NULL,
  record_type text NOT NULL CHECK (record_type IN ('MX', 'TXT', 'CNAME', 'A')),
  host text NOT NULL,
  value text NOT NULL,
  priority integer,
  ttl integer DEFAULT 3600,
  purpose text NOT NULL CHECK (purpose IN ('spf', 'dkim', 'dmarc', 'mx', 'verification')),
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_domains_workspace ON email_domains(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_domains_status ON email_domains(status);
CREATE INDEX IF NOT EXISTS idx_dns_records_email_domain ON dns_records(email_domain_id);
CREATE INDEX IF NOT EXISTS idx_dns_records_verified ON dns_records(verified);

-- Enable RLS
ALTER TABLE email_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;

-- Policies for email_domains
CREATE POLICY "Workspace members can view their email domains"
  ON email_domains FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = email_domains.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can insert email domains"
  ON email_domains FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = email_domains.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

CREATE POLICY "Workspace owners can update their email domains"
  ON email_domains FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = email_domains.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = email_domains.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

CREATE POLICY "Workspace owners can delete their email domains"
  ON email_domains FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = email_domains.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

-- Policies for dns_records
CREATE POLICY "Users can view DNS records for their workspace domains"
  ON dns_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_domains
      JOIN workspace_members ON workspace_members.workspace_id = email_domains.workspace_id
      WHERE email_domains.id = dns_records.email_domain_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can insert DNS records"
  ON dns_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_domains
      JOIN workspace_members ON workspace_members.workspace_id = email_domains.workspace_id
      WHERE email_domains.id = dns_records.email_domain_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

CREATE POLICY "Workspace owners can update DNS records"
  ON dns_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_domains
      JOIN workspace_members ON workspace_members.workspace_id = email_domains.workspace_id
      WHERE email_domains.id = dns_records.email_domain_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_domains
      JOIN workspace_members ON workspace_members.workspace_id = email_domains.workspace_id
      WHERE email_domains.id = dns_records.email_domain_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

CREATE POLICY "Workspace owners can delete DNS records"
  ON dns_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_domains
      JOIN workspace_members ON workspace_members.workspace_id = email_domains.workspace_id
      WHERE email_domains.id = dns_records.email_domain_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_domain_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_email_domains_updated_at ON email_domains;
CREATE TRIGGER update_email_domains_updated_at
  BEFORE UPDATE ON email_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_email_domain_updated_at();
