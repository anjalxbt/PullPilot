# Supabase Integration Summary

## Overview

This project now integrates Supabase for persistent user data storage after GitHub OAuth authentication. When users sign in with GitHub, their profile information is automatically stored in a Supabase database.

## What Was Added

### 1. Dependencies
- `@supabase/supabase-js` - Supabase JavaScript client library

### 2. Configuration Files

#### `/lib/supabase.ts`
- Supabase client initialization
- User interface type definition

#### `/lib/user.ts`
- Helper functions for user data operations:
  - `getUserByGithubId()` - Fetch user by GitHub ID
  - `getUserById()` - Fetch user by UUID
  - `updateUser()` - Update user profile
  - `getAllUsers()` - Get all users (admin)

### 3. Database Migration

#### `/supabase/migrations/001_create_users_table.sql`
Creates the `users` table with:
- **id**: UUID (primary key)
- **github_id**: TEXT (unique, indexed)
- **username**: TEXT
- **email**: TEXT (nullable)
- **avatar_url**: TEXT (nullable)
- **created_at**: TIMESTAMP

Includes Row Level Security (RLS) policies for data protection.

### 4. Updated Files

#### `/lib/auth.ts`
- Added `signIn` callback to create/update users in Supabase
- Updated `session` callback to fetch user data from Supabase
- Updated `jwt` callback to store GitHub ID

#### `/types/next-auth.d.ts`
- Extended `Session` interface with `githubId` and `username`
- Extended `Profile` interface with GitHub-specific fields
- Extended `JWT` interface with `githubId`

#### `/.env.example`
Added Supabase environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## How It Works

1. **User Signs In**: User clicks "Sign in with GitHub"
2. **OAuth Flow**: NextAuth handles GitHub OAuth authentication
3. **signIn Callback**: 
   - Checks if user exists in Supabase (by `github_id`)
   - Creates new user if not exists
   - Updates existing user data if exists
4. **JWT Token**: Stores GitHub ID in JWT token
5. **Session Callback**: Fetches full user data from Supabase and adds to session
6. **Client Access**: User data available via `useSession()` hook

## Usage Example

```typescript
import { useSession } from "next-auth/react";

function MyComponent() {
  const { data: session } = useSession();
  
  if (session?.user) {
    console.log(session.user.id);        // Supabase UUID
    console.log(session.user.githubId);  // GitHub ID
    console.log(session.user.username);  // GitHub username
    console.log(session.user.email);     // Email
    console.log(session.user.image);     // Avatar URL
  }
}
```

## Setup Instructions

1. **Create Supabase Project**: https://supabase.com/dashboard
2. **Run Migration**: Execute SQL from `/supabase/migrations/001_create_users_table.sql`
3. **Get Credentials**: Copy Project URL and Anon Key from Supabase dashboard
4. **Update .env**: Add Supabase credentials to your `.env` file
5. **Restart Server**: `npm run dev`

See `/supabase/README.md` for detailed setup instructions.

## Security Notes

- ✅ Row Level Security (RLS) is enabled
- ✅ Users can only read/update their own data
- ✅ Anon key is safe for client-side use (protected by RLS)
- ✅ GitHub ID is unique and indexed for fast lookups
- ✅ All database operations include error handling

## Testing

After setup, test the integration:

1. Sign in with GitHub OAuth
2. Check Supabase dashboard > Table Editor > users
3. Verify your user record was created
4. Sign out and sign in again
5. Verify user data is updated (not duplicated)

## Next Steps

Consider adding:
- User profile page to display/edit user data
- Additional user preferences/settings
- User activity tracking
- Repository connections table
- Pull request reviews table
