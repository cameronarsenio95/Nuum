/*
  # Billing System Schema

  1. New Tables
    - `stripe_customers`
      - Links workspaces to Stripe customer IDs
      - Stores customer email and metadata
    
    - `payment_methods`
      - Stores payment method details (last4, brand, expiry)
      - Links to Stripe payment method IDs
    
    - `invoices`
      - Complete invoice history
      - Includes amount, status, PDF URLs
      - Links to subscriptions and customers
    
    - `subscription_items`
      - Individual line items for subscriptions
      - Tracks quantity and pricing

  2. Security
    - Enable RLS on all tables
    - Policies for workspace owners only
    - No public access

  3. Indexes
    - Customer lookup by workspace
    - Invoice lookup by customer
    - Payment method lookup by customer
*/

-- Stripe Customers Table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id)
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace customer data"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id text NOT NULL,
  stripe_payment_method_id text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'card',
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (stripe_customer_id) REFERENCES stripe_customers(stripe_customer_id) ON DELETE CASCADE
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (
    stripe_customer_id IN (
      SELECT stripe_customer_id FROM stripe_customers
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  amount_due integer NOT NULL DEFAULT 0,
  amount_paid integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL,
  invoice_number text,
  invoice_pdf text,
  hosted_invoice_url text,
  period_start timestamptz,
  period_end timestamptz,
  due_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (stripe_customer_id) REFERENCES stripe_customers(stripe_customer_id) ON DELETE CASCADE
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Subscription Items Table
CREATE TABLE IF NOT EXISTS subscription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id text NOT NULL,
  stripe_subscription_item_id text UNIQUE NOT NULL,
  stripe_price_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription items"
  ON subscription_items FOR SELECT
  TO authenticated
  USING (
    stripe_subscription_id IN (
      SELECT stripe_subscription_id FROM workspaces
      WHERE id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_workspace ON stripe_customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer ON payment_methods(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace ON invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_subscription_items_subscription ON subscription_items(stripe_subscription_id);

-- Add stripe_customer_id to workspaces if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer ON workspaces(stripe_customer_id);
