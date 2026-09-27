import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Extraire proprement l'ID utilisateur injecté par l'API Gateway
function getUserIdFromHeader(req: Request): number | null {
  const userId = req.headers['x-user-id'];
  if (!userId) return null;
  const id = parseInt(Array.isArray(userId) ? userId[0] : userId, 10);
  return isNaN(id) ? null : id;
}

// GET /profile/me - Profil de l'utilisateur connecté
router.get('/me', async (req: Request, res: Response) => {
  const userId = getUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Non autorisé : Header x-user-id manquant' });
  }

  try {
    const user = await prisma.profile.findUnique({
      where: { userId },
      select: { userId: true, displayName: true, avatarUrl: true, bio: true, statusText: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user.userId,
      username: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      statusText: user.statusText || user.bio || 'Ready to play',
      level: 1,
      currentXp: 500,
      maxXp: 1000,
      stats: { matchesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /profile/:id - Consulter le profil public d'un autre joueur
router.get('/:id', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const user = await prisma.profile.findUnique({
      where: { userId },
      select: { userId: true, displayName: true, avatarUrl: true, bio: true, statusText: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

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

// PATCH /profile/me - Mettre à jour son propre profil
router.patch('/me', async (req: Request, res: Response) => {
  const userId = getUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { username, avatar, bio } = req.body;

    if (username) {
      const existingUser = await prisma.profile.findFirst({
        where: {
          displayName: username,
          NOT: { userId },
        },
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updatedUser = await prisma.profile.update({
      where: { userId },
      data: {
        ...(username && { displayName: username }),
        ...(avatar && { avatarUrl: avatar }),
        ...(bio !== undefined && { bio }),
      },
      select: { userId: true, displayName: true, avatarUrl: true, bio: true, statusText: true },
    });

    return res.json({
      id: updatedUser.userId,
      username: updatedUser.displayName,
      avatarUrl: updatedUser.avatarUrl,
      bio: updatedUser.bio,
      statusText: updatedUser.statusText || 'Ready to play',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;