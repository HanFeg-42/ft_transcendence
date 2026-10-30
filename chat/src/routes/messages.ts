import { Router } from 'express';
import { prisma } from '../prisma';
import { toIncoming } from '../ws/websocket';

const router = Router();

// Chat history with one friend, newest first, 50 per page (GET /messages/:friendId?cursor=<id>)
router.get('/messages/:friendId', async (req, res) => {
  const userId = Number(req.headers['x-user-id']);
  const friendId = Number(req.params.friendId);
  const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;

  if (!userId) return res.status(401).json({ error: 'Missing identity' });
  if (!friendId || Number.isNaN(friendId)) return res.status(400).json({ error: 'Invalid friendId' });

  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  res.json(rows.map(toIncoming));
});

export default router;