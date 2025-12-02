-- Create github_installations table for storing GitHub App installation data
CREATE TABLE IF NOT EXISTS github_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id BIGINT UNIQUE NOT NULL,
  account_id BIGINT NOT NULL,
  account_login TEXT NOT NULL,
  account_type TEXT NOT NULL, -- 'User' or 'Organization'
  target_type TEXT NOT NULL, -- 'User' or 'Organization'
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create repositories table for tracking installed repositories
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID REFERENCES github_installations(id) ON DELETE CASCADE,
  repo_id BIGINT UNIQUE NOT NULL,
  repo_name TEXT NOT NULL,
  repo_full_name TEXT NOT NULL,
  owner_login TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  default_branch TEXT DEFAULT 'main',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pull_request_reviews table for tracking AI-generated reviews
CREATE TABLE IF NOT EXISTS pull_request_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  pr_number INTEGER NOT NULL,
  pr_title TEXT,
  pr_author TEXT,
  review_summary TEXT NOT NULL,
  files_changed INTEGER,
  additions INTEGER,
  deletions INTEGER,
  ai_model TEXT,
  review_posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_installations_installation_id ON github_installations(installation_id);
CREATE INDEX IF NOT EXISTS idx_installations_user_id ON github_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_installation_id ON repositories(installation_id);
CREATE INDEX IF NOT EXISTS idx_repositories_repo_id ON repositories(repo_id);
CREATE INDEX IF NOT EXISTS idx_pr_reviews_repository_id ON pull_request_reviews(repository_id);
CREATE INDEX IF NOT EXISTS idx_pr_reviews_pr_number ON pull_request_reviews(pr_number);

-- Enable Row Level Security (RLS)
ALTER TABLE github_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pull_request_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for github_installations
CREATE POLICY "Users can read their own installations" ON github_installations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Allow insert for authenticated users" ON github_installations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own installations" ON github_installations
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own installations" ON github_installations
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for repositories
CREATE POLICY "Users can read repositories from their installations" ON repositories
  FOR SELECT
  USING (
    installation_id IN (
      SELECT id FROM github_installations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow insert for repositories" ON repositories
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for repositories" ON repositories
  FOR UPDATE
  USING (
    installation_id IN (
      SELECT id FROM github_installations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow delete for repositories" ON repositories
  FOR DELETE
  USING (
    installation_id IN (
      SELECT id FROM github_installations WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for pull_request_reviews
CREATE POLICY "Users can read reviews from their repositories" ON pull_request_reviews
  FOR SELECT
  USING (
    repository_id IN (
      SELECT r.id FROM repositories r
      INNER JOIN github_installations gi ON r.installation_id = gi.id
      WHERE gi.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow insert for PR reviews" ON pull_request_reviews
  FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_installations_updated_at
  BEFORE UPDATE ON github_installations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repositories_updated_at
  BEFORE UPDATE ON repositories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
