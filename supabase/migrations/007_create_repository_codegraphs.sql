-- Create repository_code_graphs table for storing code graph caches
CREATE TABLE IF NOT EXISTS public.repository_code_graphs (
    repository_id UUID PRIMARY KEY REFERENCES public.repositories(id) ON DELETE CASCADE,
    cache_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply Row Level Security
ALTER TABLE public.repository_code_graphs ENABLE ROW LEVEL SECURITY;

-- Note: Policies can be added later if needed, but since this is primarily accessed
-- by the backend service level via Service Role key, direct schema access is sufficient.
