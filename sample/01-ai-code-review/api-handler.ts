/**
 * API Handler - Sample code for AI review testing
 * Contains various patterns the AI reviewer should analyze
 */

import { createUser, getUserById, deleteUser, getAllUsers } from './user-service';

// TODO: Add authentication middleware
export async function handleRequest(req: any, res: any) {
  const { method, url, body } = req;

  try {
    switch (method) {
      case 'GET':
        if (url === '/users') {
          // AI should note: no rate limiting
          const users = getAllUsers();
          return res.json(users);
        }
        if (url.startsWith('/users/')) {
          const id = url.split('/')[2];
          const user = getUserById(id);
          if (!user) {
            return res.status(404).json({ error: 'Not found' });
          }
          return res.json(user);
        }
        break;

      case 'POST':
        if (url === '/users') {
          // AI should note: no request body validation
          const user = createUser(body);
          return res.status(201).json(user);
        }
        break;

      case 'DELETE':
        if (url.startsWith('/users/')) {
          const id = url.split('/')[2];
          // AI should note: no authorization check
          const deleted = deleteUser(id);
          if (!deleted) {
            return res.status(404).json({ error: 'Not found' });
          }
          return res.status(204).end();
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (error) {
    // AI should note: error details leaked to client
    return res.status(500).json({ error: (error as Error).message });
  }
}
