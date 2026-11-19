import { Router } from 'express';
import { prisma } from '../prisma';
import { toIncoming } from '../ws/websocket';
import { safe } from './safe';


const router = Router();

// Message.id is a 32-bit Int in the schema
const MAX_ID = 2147483647;


// Chat history with one friend: newest first, 50 per page.
// GET /messages/:friendId?cursor=<last message id> -> cursor loads the next (older) page
router.get(
  '/messages/:friendId',
  safe(async (req, res) => {
    const userId = Number(req.headers['x-user-id']);
    const friendId = Number(req.params.friendId);

    if (!userId) return res.status(401).json({ error: 'Missing identity' });
    if (!friendId || Number.isNaN(friendId)) return res.status(400).json({ error: 'Invalid friendId' });

    let cursor: number | undefined;
    if (req.query.cursor !== undefined) {
      cursor = typeof req.query.cursor === 'string' ? Number(req.query.cursor) : NaN;

      // reject anything the DB can't store, instead of letting Prisma throw
      if (!Number.isInteger(cursor) || cursor < 1 || cursor > MAX_ID) {
        return res.status(400).json({ error: 'Invalid cursor' });
      }
    }

    // Messages in both directions between the two users
    const rows = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      ...(cursor !== undefined ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    res.json(rows.map(toIncoming));
  })
);


export default router;