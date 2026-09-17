-- Fazaa verification center: provider review workflow, contact proof, document visibility, audit trail.
DO $$ BEGIN
  ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'under_review';
  ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'changes_requested';
  ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'suspended';
  ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'expired';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE verification_document_status ADD VALUE IF NOT EXISTS 'hidden';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'verification_staff';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_audit_action AS ENUM ('submitted', 'review_started', 'approved', 'rejected', 'changes_requested', 'hidden', 'unhidden', 'contact_updated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_contacted boolean NOT NULL DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_contacted_at timestamptz;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_contacted_by integer REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_contact_note text;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

CREATE TABLE IF NOT EXISTS provider_verification_audit (
  id serial PRIMARY KEY,
  provider_id integer NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  document_id integer REFERENCES provider_verification_documents(id) ON DELETE SET NULL,
  actor_id integer NOT NULL,
  action verification_audit_action NOT NULL,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_verification_audit_provider_idx ON provider_verification_audit(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS provider_verification_documents_provider_status_idx ON provider_verification_documents(provider_id, status);
