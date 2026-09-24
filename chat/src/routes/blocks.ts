import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.post('/blocks/:blockedId', async (req: Request, res: Response) => {
  const blockerId = Number(req.headers['x-user-id']);
  const blockedId = Number(req.params.blockedId);

  if (!blockerId) return res.status(401).json({ error: 'Missing identity' });
  if (!blockedId || blockedId === blockerId) return res.status(400).json({ error: 'Invalid blockedId' });

  await prisma.blockedUser.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    update: {},
    create: { blockerId, blockedId },
  });

  res.status(201).json({ blocked: true });
});

router.delete('/blocks/:blockedId', async (req: Request, res: Response) => {
  const blockerId = Number(req.headers['x-user-id']);
  const blockedId = Number(req.params.blockedId);

  if (!blockerId) return res.status(401).json({ error: 'Missing identity' });

  await prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } });

  res.json({ blocked: false });
});

// Lets the frontend know, for a given friend, whether YOU blocked them
// or THEY blocked you — the UI needs both to decide what to show.
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

export default router;