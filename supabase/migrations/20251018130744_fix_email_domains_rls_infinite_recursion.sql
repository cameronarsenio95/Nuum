/*
  # Fix Email Domains RLS Infinite Recursion

  1. Changes
    - Drop all existing RLS policies on email_domains and dns_records
    - Create new simplified policies without workspace_members JOIN
    - Use direct workspace_id comparison for workspace owners
    - Keep support staff policies simple

  2. Security
    - Support staff can access all domains and DNS records
    - Workspace owners can manage their workspace domains
    - No infinite recursion through workspace_members
*/

-- Drop all existing policies for email_domains
DROP POLICY IF EXISTS "Workspace members can view their email domains" ON email_domains;
DROP POLICY IF EXISTS "Workspace owners can insert email domains" ON email_domains;
DROP POLICY IF EXISTS "Workspace owners can update their email domains" ON email_domains;
DROP POLICY IF EXISTS "Workspace owners can delete their email domains" ON email_domains;
DROP POLICY IF EXISTS "Support staff can view all email domains" ON email_domains;
DROP POLICY IF EXISTS "Support staff can update all email domains" ON email_domains;

-- Drop all existing policies for dns_records
DROP POLICY IF EXISTS "Users can view DNS records for their workspace domains" ON dns_records;
DROP POLICY IF EXISTS "Workspace owners can insert DNS records" ON dns_records;
DROP POLICY IF EXISTS "Workspace owners can update DNS records" ON dns_records;
DROP POLICY IF EXISTS "Workspace owners can delete DNS records" ON dns_records;
DROP POLICY IF EXISTS "Support staff can view all DNS records" ON dns_records;
DROP POLICY IF EXISTS "Support staff can update all DNS records" ON dns_records;

-- Support staff policies for email_domains (MOST PERMISSIVE - checked first)
CREATE POLICY "Support staff can view all email domains"
  ON email_domains FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  );

CREATE POLICY "Support staff can manage all email domains"
  ON email_domains FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  );

-- Workspace policies for email_domains (fallback for non-support users)
CREATE POLICY "Workspace owners can view their email domains"
  ON email_domains FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can insert email domains"
  ON email_domains FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update their email domains"
  ON email_domains FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can delete their email domains"
  ON email_domains FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Support staff policies for dns_records (MOST PERMISSIVE - checked first)
CREATE POLICY "Support staff can view all DNS records"
  ON dns_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  );

CREATE POLICY "Support staff can manage all DNS records"
  ON dns_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  );

-- Workspace policies for dns_records (fallback for non-support users)
CREATE POLICY "Workspace owners can view their DNS records"
  ON dns_records FOR SELECT
  TO authenticated
  USING (
    email_domain_id IN (
      SELECT ed.id FROM email_domains ed
      JOIN workspaces w ON w.id = ed.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can insert DNS records"
  ON dns_records FOR INSERT
  TO authenticated
  WITH CHECK (
    email_domain_id IN (
      SELECT ed.id FROM email_domains ed
      JOIN workspaces w ON w.id = ed.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update their DNS records"
  ON dns_records FOR UPDATE
  TO authenticated
  USING (
    email_domain_id IN (
      SELECT ed.id FROM email_domains ed
      JOIN workspaces w ON w.id = ed.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    email_domain_id IN (
      SELECT ed.id FROM email_domains ed
      JOIN workspaces w ON w.id = ed.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can delete their DNS records"
  ON dns_records FOR DELETE
  TO authenticated
  USING (
    email_domain_id IN (
      SELECT ed.id FROM email_domains ed
      JOIN workspaces w ON w.id = ed.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );
