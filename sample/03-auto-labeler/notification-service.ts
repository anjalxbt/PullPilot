/**
 * New feature file WITHOUT corresponding tests
 * This should trigger the "needs-tests" label
 * 
 * PR Title suggestion: "feat: add new notification service"
 */

interface NotificationOptions {
  userId: string;
  type: 'email' | 'push' | 'in-app';
  subject: string;
  body: string;
  priority?: 'low' | 'normal' | 'high';
}

export class NotificationService {
  private queue: NotificationOptions[] = [];

  async send(options: NotificationOptions): Promise<boolean> {
    this.queue.push(options);
    // Simulate sending
    return true;
  }

  async sendBatch(notifications: NotificationOptions[]): Promise<number> {
    let sent = 0;
    for (const notification of notifications) {
      const success = await this.send(notification);
      if (success) sent++;
    }
    return sent;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}
