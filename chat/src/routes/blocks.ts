import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { onlineUsers } from '../ws/presence';
import { WebSocket } from 'ws';


const router = Router();

function notifyBlockUpdate(blockerId: number, blockedId: number, blocked: boolean) {
  const event = JSON.stringify({
    event: 'block_updated',
    data: { blockerId, blockedId, blocked },
  });

  for (const userId of [blockerId, blockedId]) {
    const sockets = onlineUsers.get(String(userId));
    if (!sockets) continue;

    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(event);
      }
    }
  }
}


//1. Blocking a User (POST /blocks/:blockedId)
router.post('/blocks/:blockedId', async (req: Request, res: Response) => {
  const blockerId = Number(req.headers['x-user-id']);
  const blockedId = Number(req.params.blockedId);//Extracts URL path parameters. In /blocks/15,

  if (!blockerId) return res.status(401).json({ error: 'Missing identity' });
  if (!blockedId || blockedId === blockerId) return res.status(400).json({ error: 'Invalid blockedId' });

  await prisma.blockedUser.upsert({
    
    where: { blockerId_blockedId: { blockerId, blockedId } },
    update: {},
    create: { blockerId, blockedId },
  });
  await prisma.friendship.deleteMany({
  where: {
    userLowId: Math.min(blockerId, blockedId),
    userHighId: Math.max(blockerId, blockedId),
  },
  
});
  notifyBlockUpdate(blockerId, blockedId, true);
  res.status(201).json({ blocked: true });
});


// 2. Unblocking a User (DELETE /blocks/:blockedId)
router.delete('/blocks/:blockedId', async (req: Request, res: Response) => {
  const blockerId = Number(req.headers['x-user-id']);
  const blockedId = Number(req.params.blockedId);

  if (!blockerId) return res.status(401).json({ error: 'Missing identity' });

  await prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } });
  notifyBlockUpdate(blockerId, blockedId, false);

  res.json({ blocked: false });
});



// 3. Checking Block Status (GET /blocks/status/:friendId)
router.get('/blocks/status/:friendId', async (req: Request, res: Response) => {
  const userId = Number(req.headers['x-user-id']);
  const friendId = Number(req.params.friendId);

  if (!userId) return res.status(401).json({ error: 'Missing identity' });

  const [iBlockedThem, theyBlockedMe] = await Promise.all([
    prisma.blockedUser.findUnique({ where: { blockerId_blockedId: { blockerId: userId, blockedId: friendId } } }),
    prisma.blockedUser.findUnique({ where: { blockerId_blockedId: { blockerId: friendId, blockedId: userId } } }),
  ]);

  res.json({ iBlockedThem: !!iBlockedThem, theyBlockedMe: !!theyBlockedMe });
});


// 4. List users blocked by the current user (GET /blocks)
router.get('/blocks', async (req: Request, res: Response) => {
  const blockerId = Number(req.headers['x-user-id']);

  if (!Number.isSafeInteger(blockerId) || blockerId <= 0) {
    return res.status(401).json({ error: 'Missing identity' });
  }

  try {
    const blocks = await prisma.blockedUser.findMany({
      where: { blockerId },
      select: { blockedId: true },
    });
    const blockedIds = blocks.map((block) => block.blockedId);
    if (blockedIds.length === 0) return res.json([]);

    const authUrl = process.env.AUTH_SERVICE_URL || 'http://auth:3001';
    const userUrl = process.env.USER_SERVICE_URL || 'http://user:3004';
    const usersResponse = await fetch(`${authUrl}/users`);
    if (!usersResponse.ok) throw new Error(`Auth service returned ${usersResponse.status}`);

    const rawUsers: unknown = await usersResponse.json();
    if (!Array.isArray(rawUsers)) throw new Error('Invalid users response from auth service');

    const users = rawUsers.flatMap((raw): { id: number; username: string; avatar: string | null }[] => {
      if (raw === null || typeof raw !== 'object') return [];
      const item = raw as { id?: unknown; username?: unknown; avatar?: unknown };
      if (
        typeof item.id !== 'number' ||
        !Number.isSafeInteger(item.id) ||
        typeof item.username !== 'string' ||
        !blockedIds.includes(item.id)
      ) return [];
      return [{
        id: item.id,
        username: item.username,
        avatar: typeof item.avatar === 'string' ? item.avatar : null,
      }];
    });

    if (users.length > 0) {
      const ids = users.map((user) => user.id).join(',');
      const profileResponse = await fetch(`${userUrl}/profile/profiles?ids=${ids}`);
      if (profileResponse.ok) {
        const rawProfiles: unknown = await profileResponse.json();
        if (Array.isArray(rawProfiles)) {
          const avatars = new Map<number, string | null>();
          for (const rawProfile of rawProfiles) {
            if (rawProfile === null || typeof rawProfile !== 'object') continue;
            const profile = rawProfile as { id?: unknown; avatarUrl?: unknown };
            if (typeof profile.id === 'number' && Number.isSafeInteger(profile.id)) {
              avatars.set(profile.id, typeof profile.avatarUrl === 'string' ? profile.avatarUrl : null);
            }
          }
          for (const user of users) {
            if (avatars.has(user.id)) user.avatar = avatars.get(user.id) ?? null;
          }
        }
      }
    }

    return res.json(users);
  } catch (error) {
    console.error('[CHAT] Failed to list blocked users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
