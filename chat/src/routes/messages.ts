import { Router } from 'express';
import { prisma } from '../prisma';
import { toIncoming } from '../ws/websocket';
import { safe } from './safe';


const router = Router();


// Chat history with one friend: newest first
router.get('/messages/:friendId', safe(async (req, res) => {
    const userId = Number(req.headers['x-user-id']);
    const friendId = Number(req.params.friendId);

    if (!userId) return res.status(401).json({ error: 'Missing identity' });
    if (!friendId || Number.isNaN(friendId)) return res.status(400).json({ error: 'Invalid friendId' });


    // Messages in both directions between the two users
    const rows = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 500,
    });

    res.json(rows.map(toIncoming));
  })
);


export default router;