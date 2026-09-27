import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();


// 1. Fetching Chat History (GET /messages/:friendId)
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




// 2. Clearing a Conversation (DELETE /messages/:friendId)
router.delete('/messages/:friendId', async (req: Request, res: Response) => {
  const userId = Number(req.headers['x-user-id']);
  const friendId = Number(req.params.friendId);

  if (!userId) {
    return res.status(401).json({ error: 'Missing identity' });
  }
  if (!friendId || Number.isNaN(friendId)) {
    return res.status(400).json({ error: 'Invalid friendId' });
  }

  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
  });

  res.json({ cleared: true });
});

export default router;