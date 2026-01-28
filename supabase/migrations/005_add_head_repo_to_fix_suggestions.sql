-- Add head repo info for supporting fork PRs
-- When a PR comes from a fork, we need to access the file from the fork repo, not the base repo

ALTER TABLE fix_suggestions 
ADD COLUMN IF NOT EXISTS head_repo_owner TEXT,
ADD COLUMN IF NOT EXISTS head_repo_name TEXT;

-- Comment for documentation
COMMENT ON COLUMN fix_suggestions.head_repo_owner IS 'Owner of the head (source) repo - for fork PRs this is the fork owner';
COMMENT ON COLUMN fix_suggestions.head_repo_name IS 'Name of the head (source) repo - for fork PRs this is the fork repo name';
