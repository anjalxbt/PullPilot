/**
 * Sample bug fix file - triggers "bug" label detection
 * 
 * PR Title suggestion: "fix: resolve critical login authentication bug"
 * PR Description: "Fixes a bug where users couldn't login due to incorrect token validation"
 */

// Bug fix: Token validation was using wrong comparison
export function validateToken(token: string, expectedToken: string): boolean {
  // BEFORE (buggy): was using assignment instead of comparison
  // if (token = expectedToken) { return true; }
  
  // AFTER (fixed):
  if (token === expectedToken) {
    return true;
  }
  return false;
}

// Bug fix: Off-by-one error in pagination
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  // BEFORE (buggy): const start = page * pageSize;
  // AFTER (fixed):
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return items.slice(start, end);
}
