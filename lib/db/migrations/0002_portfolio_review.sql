-- Fazaa portfolio review workflow.
DO $$ BEGIN
  CREATE TYPE portfolio_review_status AS ENUM ('pending', 'approved', 'rejected', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE portfolio_rejection_reason AS ENUM ('unrelated', 'low_quality', 'contact_info', 'external_ad', 'not_original', 'policy_violation', 'insufficient_proof', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS review_status portfolio_review_status NOT NULL DEFAULT 'pending';
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS rejection_reason portfolio_rejection_reason;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS reviewer_note text;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS reviewed_by integer;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE provider_verification_audit ADD COLUMN IF NOT EXISTS portfolio_id integer REFERENCES portfolio_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS portfolio_items_review_queue_idx ON portfolio_items(review_status, created_at DESC);
CREATE INDEX IF NOT EXISTS provider_verification_audit_portfolio_idx ON provider_verification_audit(portfolio_id, created_at DESC);
