-- Migration: Create Claims Table
-- Description: Support tickets/claims system for admin panel
-- Date: 2025-12-19

-- Create enum type for claim status
DO $$ BEGIN
    CREATE TYPE claim_status AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status claim_status NOT NULL DEFAULT 'OPEN',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(100),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_claims_updated_at ON claims;
CREATE TRIGGER trigger_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION update_claims_updated_at();

-- Grant permissions
GRANT ALL ON claims TO postgres;
GRANT ALL ON claims TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE claims_id_seq TO authenticated;
