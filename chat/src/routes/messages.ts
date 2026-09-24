import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/messages/:friendId', async (req: Request, res: Response) => {
  const userId = Number(req.headers['x-user-id']);
  const friendId = Number(req.params.friendId);
  const limit = 50;
  const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;

  if (!userId) {
    return res.status(401).json({ error: 'Missing identity' });
  }
  if (!friendId || Number.isNaN(friendId)) {
    return res.status(400).json({ error: 'Invalid friendId' });
  }

  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  // Map to the same shape the frontend already expects from the WS payload
  // (sender_id / receiver_id / created_at, not camelCase).
  const messages = rows.map((m) => ({
    id: m.id,
    sender_id: m.senderId,
    receiver_id: m.receiverId,
    content: m.content,
    created_at: m.createdAt.toISOString(),
  }));

  res.json(messages);
});

export default router;