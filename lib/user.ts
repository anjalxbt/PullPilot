import { supabase, User } from "./supabase";

/**
 * Fetch user data by GitHub ID
 */
export async function getUserByGithubId(githubId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("github_id", githubId)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  return data;
}

/**
 * Fetch user data by user ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUser(
  githubId: string,
  updates: Partial<Omit<User, "id" | "github_id" | "created_at">>
): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("github_id", githubId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user:", error);
    return null;
  }

  return data;
}

/**
 * Get all users (admin function - use with caution)
 */
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return data || [];
}
