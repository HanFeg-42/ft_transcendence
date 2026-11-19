import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { onlineUsers } from '../ws/presence';
import { WebSocket } from 'ws';
import { ChatEvents } from '../../../shared/types/chat-types';
import { getPublicUsers } from './friends';

const router = Router();

function parsePositiveId(raw: unknown): number | null {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const currentUserId = (req: Request) => parsePositiveId(req.headers['x-user-id']);

function notifyBlockUpdate(blockerId: number, blockedId: number, blocked: boolean) {
  const event = JSON.stringify({
    event: ChatEvents.BLOCK_UPDATED,
    data: { blockerId, blockedId, blocked },
  });

  for (const userId of [blockerId, blockedId]) {
    const sockets = onlineUsers.get(String(userId));
    if (!sockets) continue;

    for (const socket of sockets) {
      if (socket.readyState !== WebSocket.OPEN) {
        sockets.delete(socket);
        continue;
      }
      try {
        socket.send(event);
      } catch {
        // socket closed while sending: nothing to do
      }
    }
  }
}

// Blocking a user (POST /blocks/:blockedId)
router.post('/blocks/:blockedId', async (req: Request, res: Response) => {
  const blockerId = currentUserId(req);
  const blockedId = parsePositiveId(req.params.blockedId);
 
  if (!blockerId) return res.status(401).json({ error: 'Missing identity' });
  if (!blockedId || blockedId === blockerId) {
    return res.status(400).json({ error: 'Invalid blockedId' });
  }
 
  try {
    await prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });
 
    notifyBlockUpdate(blockerId, blockedId, true);
    return res.status(201).json({ blocked: true });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Unblocking a user (DELETE /blocks/:blockedId)
router.delete('/blocks/:blockedId', async (req: Request, res: Response) => {
  const blockerId = currentUserId(req);
  const blockedId = parsePositiveId(req.params.blockedId);

  if (!blockerId) return res.status(401).json({ error: 'Missing identity' });
  if (!blockedId || blockedId === blockerId) {
    return res.status(400).json({ error: 'Invalid blockedId' });
  }

  try {
    await prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } });
    notifyBlockUpdate(blockerId, blockedId, false);
    return res.json({ blocked: false });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Check block status (GET /blocks/status/:friendId)
router.get('/blocks/status/:friendId', async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  const friendId = parsePositiveId(req.params.friendId);

  if (!userId) return res.status(401).json({ error: 'Missing identity' });
  if (!friendId || friendId === userId) {
    return res.status(400).json({ error: 'Invalid friendId' });
  }

  try {
    const [iBlockedThem, theyBlockedMe] = await Promise.all([
      prisma.blockedUser.findUnique({
        where: { blockerId_blockedId: { blockerId: userId, blockedId: friendId } },
      }),
      prisma.blockedUser.findUnique({
        where: { blockerId_blockedId: { blockerId: friendId, blockedId: userId } },
      }),
    ]);

    return res.json({ iBlockedThem: !!iBlockedThem, theyBlockedMe: !!theyBlockedMe });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// List users blocked by the current user (GET /blocks)
router.get('/blocks', async (req: Request, res: Response) => {
  const blockerId = currentUserId(req);
  if (!blockerId) return res.status(401).json({ error: 'Missing identity' });

  try {
    const blocks = await prisma.blockedUser.findMany({
      where: { blockerId },
      select: { blockedId: true },
    });
    const blockedIds = blocks.map((block) => block.blockedId);
    if (blockedIds.length === 0) return res.json([]);

    const users = await getPublicUsers(blockedIds);
    return res.json(users);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;