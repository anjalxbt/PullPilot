/**
 * Sample API file - triggers "API changes need tests" rule
 * Place in src/api/ path to trigger the file-pattern rule
 */

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export async function fetchUsers(): Promise<ApiResponse<any[]>> {
  // This console.log should trigger the "no-console-logs" rule
  console.log('Fetching users from API');
  
  const response = await fetch('/api/users');
  const data = await response.json();
  
  return {
    data,
    status: response.status,
    message: 'Success',
  };
}

export async function createUser(name: string, email: string): Promise<ApiResponse<any>> {
  console.log('Creating user:', name, email);
  
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
  
  return {
    data: await response.json(),
    status: response.status,
    message: 'Created',
  };
}
