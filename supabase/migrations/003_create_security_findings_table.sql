-- Create security_findings table for storing security scan results
CREATE TABLE IF NOT EXISTS security_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES pull_request_reviews(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  file_path TEXT,
  line_number INTEGER,
  code_snippet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_security_findings_review_id ON security_findings(review_id);
CREATE INDEX IF NOT EXISTS idx_security_findings_severity ON security_findings(severity);
CREATE INDEX IF NOT EXISTS idx_security_findings_category ON security_findings(category);
CREATE INDEX IF NOT EXISTS idx_security_findings_rule_id ON security_findings(rule_id);

-- Enable Row Level Security (RLS)
ALTER TABLE security_findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_findings
CREATE POLICY "Users can read security findings from their repositories" ON security_findings
  FOR SELECT
  USING (
    review_id IN (
      SELECT pr.id FROM pull_request_reviews pr
      INNER JOIN repositories r ON pr.repository_id = r.id
      INNER JOIN github_installations gi ON r.installation_id = gi.id
      WHERE gi.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow insert for security findings" ON security_findings
  FOR INSERT
  WITH CHECK (true);

-- Add security summary columns to pull_request_reviews table
ALTER TABLE pull_request_reviews 
ADD COLUMN IF NOT EXISTS security_critical INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS security_high INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS security_medium INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS security_low INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS security_total INTEGER DEFAULT 0;
