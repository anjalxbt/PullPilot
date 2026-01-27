-- Create fix_suggestions table for storing auto-fix suggestions
-- These are fixable issues detected by PullPilot that users can apply with one click

CREATE TABLE IF NOT EXISTS fix_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES pull_request_reviews(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    pr_number INTEGER NOT NULL,
    pr_branch TEXT NOT NULL,
    pr_author TEXT NOT NULL,
    
    -- Fix details
    fix_type TEXT NOT NULL CHECK (fix_type IN ('remove_line', 'replace_line', 'insert_line')),
    file_path TEXT NOT NULL,
    line_number INTEGER NOT NULL,
    original_content TEXT,
    replacement_content TEXT,
    description TEXT NOT NULL,
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    category TEXT NOT NULL,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed', 'expired')),
    applied_at TIMESTAMPTZ,
    applied_by TEXT,
    commit_sha TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fix_suggestions_review_id ON fix_suggestions(review_id);
CREATE INDEX IF NOT EXISTS idx_fix_suggestions_repository_id ON fix_suggestions(repository_id);
CREATE INDEX IF NOT EXISTS idx_fix_suggestions_status ON fix_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_fix_suggestions_pr_number ON fix_suggestions(pr_number);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_fix_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fix_suggestions_updated_at
    BEFORE UPDATE ON fix_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_fix_suggestions_updated_at();

-- RLS policies
ALTER TABLE fix_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage fix_suggestions"
    ON fix_suggestions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE fix_suggestions IS 'Stores auto-fix suggestions that can be applied by users via one-click action';
COMMENT ON COLUMN fix_suggestions.fix_type IS 'Type of fix: remove_line, replace_line, or insert_line';
COMMENT ON COLUMN fix_suggestions.status IS 'pending=awaiting action, applied=fix committed, dismissed=user skipped, expired=PR closed';
