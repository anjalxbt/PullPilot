-- Add unique constraint on (repository_id, pr_number) to pull_request_reviews
-- This prevents duplicate review entries for the same PR and enables upsert behavior.

-- First, remove duplicate rows keeping only the latest review per (repository_id, pr_number)
DELETE FROM pull_request_reviews
WHERE id NOT IN (
    SELECT DISTINCT ON (repository_id, pr_number) id
    FROM pull_request_reviews
    ORDER BY repository_id, pr_number, review_posted_at DESC
);

-- Now add the unique constraint
ALTER TABLE pull_request_reviews
  ADD CONSTRAINT unique_repo_pr UNIQUE (repository_id, pr_number);

-- Add RLS policy for updates (needed for upsert to work)
CREATE POLICY "Allow update for PR reviews" ON pull_request_reviews
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
