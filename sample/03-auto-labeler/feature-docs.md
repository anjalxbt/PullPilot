# New Feature: User Notifications

This document describes the new user notification feature.

## Overview
Added a new notification system that sends email and in-app notifications.

## Configuration
Set the following environment variables:
- `NOTIFICATION_EMAIL_PROVIDER` - Email service provider
- `NOTIFICATION_RATE_LIMIT` - Max notifications per hour

## Usage
```typescript
import { sendNotification } from './notifications';

await sendNotification({
  userId: '123',
  type: 'email',
  subject: 'Welcome!',
  body: 'Thanks for signing up.'
});
```
