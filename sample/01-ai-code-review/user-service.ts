/**
 * User Service - Sample code for AI review testing
 * This file demonstrates various code patterns for AI analysis
 */

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: Date;
}

interface CreateUserInput {
  name: string;
  email: string;
  role?: 'admin' | 'user' | 'moderator';
}

// Simple in-memory store for demonstration
const users: Map<string, User> = new Map();

/**
 * Create a new user
 */
export function createUser(input: CreateUserInput): User {
  const id = Math.random().toString(36).substring(2, 15);

  // No input validation - AI should flag this
  const user: User = {
    id,
    name: input.name,
    email: input.email,
    role: input.role || 'user',
    createdAt: new Date(),
  };

  users.set(id, user);
  return user;
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | undefined {
  return users.get(id);
}

/**
 * Update user email - no validation
 */
export function updateUserEmail(userId: string, newEmail: string): boolean {
  const user = users.get(userId);
  if (!user) return false;

  // No email format validation - AI should suggest adding validation
  user.email = newEmail;
  return true;
}

/**
 * Delete user
 */
export function deleteUser(userId: string): boolean {
  return users.delete(userId);
}

/**
 * Get all users - returns entire collection without pagination
 */
export function getAllUsers(): User[] {
  // AI should flag: No pagination for large datasets
  return Array.from(users.values());
}

/**
 * Search users by name
 */
export function searchUsers(query: string): User[] {
  // AI should flag: Linear search, could be improved with indexing
  return Array.from(users.values()).filter(
    user => user.name.toLowerCase().includes(query.toLowerCase())
  );
}
