-- Create users table for storing GitHub OAuth user data
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on github_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Create policy to allow insert for authenticated users
CREATE POLICY "Allow insert for authenticated users" ON users
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow update for own data
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text);
