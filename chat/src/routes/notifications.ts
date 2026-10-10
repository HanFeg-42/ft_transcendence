import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();


// GET /notifications
// Returns the current user's notifications, newest first.
router.get('/notifications', async (req: Request, res: Response) => {
  const userId = Number(req.headers['x-user-id']);

  if (!userId) {
    return res.status(401).json({ error: 'Missing identity' });
  }

  const limit = Math.min(Number(req.query.limit) || 20, 50);
  let cursor: bigint | undefined;
  if (req.query.cursor !== undefined) {
    if (typeof req.query.cursor !== 'string' || !req.query.cursor.trim()) {
      return res.status(400).json({ error: 'Invalid cursor' });
    }
    try {
      cursor = BigInt(req.query.cursor);
    } catch {
      return res.status(400).json({ error: 'Invalid cursor' });
    }
  }
  const unread = req.query.unread as string | undefined;

  if (unread !== undefined && unread !== 'true' && unread !== 'false') {
    return res.status(400).json({ error: 'Invalid unread filter' });
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unread !== undefined && { isRead: unread === 'false' }),
    },
    orderBy: [
      { createdAt: 'desc' },
      { id: 'desc' },
    ],
    take: limit,
    ...(cursor !== undefined && {
      skip: 1,
      cursor: { id: cursor },
    }),
  });

  const nextCursor =
    notifications.length === limit
      ? notifications[notifications.length - 1].id.toString()
      : null;

  return res.json({
    notifications: notifications.map((notification) => ({
      id: notification.id.toString(),
      userId: notification.userId,
      type: notification.type,
      payload: notification.payload,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    })),
    nextCursor,
  });
});


// GET /notifications/unread-count
router.get('/notifications/unread-count', async (req: Request, res: Response) => {
  const userId = Number(req.headers['x-user-id']);

  if (!userId) {
    return res.status(401).json({ error: 'Missing identity' });
  }

  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return res.json({ count });
});


// PATCH /notifications/:id/read
router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  const userId = Number(req.headers['x-user-id']);
  const notificationId = req.params.id;

  if (!userId) {
    return res.status(401).json({ error: 'Missing identity' });
  }

  let id: bigint;

  try {
    id = BigInt(notificationId);
  } catch {
    return res.status(400).json({ error: 'Invalid notification id' });
  }

  const result = await prisma.notification.updateMany({
    where: {
      id,
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  if (result.count === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  return res.json({ read: true });
});


// POST /notifications/read-all
router.post('/notifications/read-all', async (req: Request, res: Response) => {
  const userId = Number(req.headers['x-user-id']);

  if (!userId) {
    return res.status(401).json({ error: 'Missing identity' });
  }

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return res.json({
    read: true,
    count: result.count,
  });
});


export default router;
