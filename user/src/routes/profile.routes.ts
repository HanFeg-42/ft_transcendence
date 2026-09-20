import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Extraire proprement l'ID utilisateur injecté par l'API Gateway
function getUserIdFromHeader(req: Request): string | null {
  const userId = req.headers['x-user-id'];
  if (!userId) return null;
  return Array.isArray(userId) ? userId[0] : userId;
}

// GET /profile/me - Profil de l'utilisateur connecté
router.get('/me', async (req: Request, res: Response) => {
  const userId = getUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Non autorisé : Header x-user-id manquant' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatar: true, bio: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      username: user.username,
      avatarUrl: user.avatar,
      statusText: user.bio || 'Ready to play',
      level: 1,
      currentXp: 500,
      maxXp: 1000,
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /profile/:id - Consulter le profil public d'un autre joueur
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, avatar: true, bio: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
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
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(avatar && { avatar }),
        ...(bio !== undefined && { bio }),
      },
      select: { id: true, username: true, avatar: true, bio: true }
    });

    return res.json(updatedUser);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;