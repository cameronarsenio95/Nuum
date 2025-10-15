/*
  # Add rights management fields to content_media

  1. Changes
    - Add `usage_rights` array field for approved usage types
    - Add `rights_expiry` date field for rights expiration
    - Add `usage_territories` array field for geographical rights
    - Add `usage_notes` text field for additional rights information

  2. Notes
    - All fields are optional (nullable)
    - Enables tracking of content usage rights and permissions
    - Helps brands comply with creator agreements
*/

DO $$
BEGIN
  -- Add usage_rights array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'usage_rights'
  ) THEN
    ALTER TABLE content_media ADD COLUMN usage_rights text[] DEFAULT '{}';
  END IF;

  -- Add rights_expiry date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'rights_expiry'
  ) THEN
    ALTER TABLE content_media ADD COLUMN rights_expiry timestamptz;
  END IF;

  -- Add usage_territories array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'usage_territories'
  ) THEN
    ALTER TABLE content_media ADD COLUMN usage_territories text[] DEFAULT '{Worldwide}';
  END IF;

  -- Add usage_notes text
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'usage_notes'
  ) THEN
    ALTER TABLE content_media ADD COLUMN usage_notes text;
  END IF;
END $$;
