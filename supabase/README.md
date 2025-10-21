# Supabase Setup Guide

This guide will help you set up Supabase for user data storage after GitHub OAuth login.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Your GitHub OAuth credentials already configured

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in your project details:
   - Project name
   - Database password (save this securely)
   - Region (choose closest to your users)
4. Click "Create new project"

## Step 2: Run the Database Migration

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `migrations/001_create_users_table.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration

This will create:
- A `users` table with columns: `id`, `github_id`, `username`, `email`, `avatar_url`, `created_at`
- An index on `github_id` for faster lookups
- Row Level Security (RLS) policies for data protection

## Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **Anon/Public Key** (under "Project API keys")

## Step 4: Update Your Environment Variables

Add the following to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace the placeholder values with your actual Supabase credentials from Step 3.

## Step 5: Verify the Setup

1. Restart your development server: `npm run dev`
2. Sign in with GitHub OAuth
3. Check your Supabase dashboard > Table Editor > users table
4. You should see a new user record created with your GitHub data

## Database Schema

The `users` table has the following structure:

| Column      | Type      | Description                          |
|-------------|-----------|--------------------------------------|
| id          | UUID      | Primary key (auto-generated)         |
| github_id   | TEXT      | GitHub user ID (unique)              |
| username    | TEXT      | GitHub username                      |
| email       | TEXT      | User email (nullable)                |
| avatar_url  | TEXT      | GitHub avatar URL (nullable)         |
| created_at  | TIMESTAMP | Account creation timestamp           |

## Security

- Row Level Security (RLS) is enabled on the users table
- Users can only read and update their own data
- The anon key is safe to use in client-side code as it's protected by RLS policies

## Troubleshooting

### Users not being created
- Check your Supabase credentials in `.env`
- Verify the migration was run successfully
- Check the browser console and server logs for errors

### RLS Policy Issues
- Ensure RLS is enabled on the users table
- Verify the policies were created correctly
- Check that you're using the correct Supabase client configuration

## Next Steps

- Add more user-related features (profile updates, preferences, etc.)
- Create additional tables for your application data
- Set up Supabase Auth if you want to use it instead of NextAuth
