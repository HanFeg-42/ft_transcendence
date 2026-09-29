import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

function getUserIdFromHeader(req: Request): number | null {
  const userId = req.headers['x-user-id'];
  if (!userId) return null;
  const id = parseInt(Array.isArray(userId) ? userId[0] : userId, 10);
  return isNaN(id) ? null : id;
}

// Helper : récupère ou crée le Profile
async function getOrCreateProfile(userId: number) {
  let profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId,
        displayName: `Player${userId}`,
        bio: '',
        statusText: 'Ready to play',
      },
    });
  }

  return profile;
}

// GET /profile/me
router.get('/me', async (req: Request, res: Response) => {
  const userId = getUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Non autorisé : Header x-user-id manquant' });
  }

  try {
    const user = await getOrCreateProfile(userId);

    return res.json({
      id: user.userId,
      username: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      statusText: user.statusText || 'Ready to play',
      level: 1,
      currentXp: 500,
      maxXp: 1000,
      stats: { matchesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
    });
  } catch (err: any) {
    console.error('[USER] getMyProfile error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /profile/:id
router.get('/:id', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const user = await getOrCreateProfile(userId);

    return res.json({
      id: user.userId,
      username: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      statusText: user.statusText || 'Ready to play',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /profile/me
router.patch('/me', async (req: Request, res: Response) => {
  const userId = getUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { username, avatar, bio } = req.body;

    if (username) {
      const existing = await prisma.profile.findFirst({
        where: { displayName: username, NOT: { userId } },
      });
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updated = await prisma.profile.upsert({
      where: { userId },
      update: {
        ...(username && { displayName: username }),
        ...(avatar && { avatarUrl: avatar }),
        ...(bio !== undefined && { bio }),
      },
      create: {
        userId,
        displayName: username || `Player${userId}`,
        avatarUrl: avatar,
        bio: bio || '',
        statusText: 'Ready to play',
      },
    });

    return res.json({
      id: updated.userId,
      username: updated.displayName,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
      statusText: updated.statusText || 'Ready to play',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;