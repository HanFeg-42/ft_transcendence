import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /profile/me - Profil de l'utilisateur connecté
router.get('/me', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, avatar: true, bio: true }
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Tu peux renvoyer l'objet formatté pour ton composant React :
  return res.json({
    username: user.username,
    avatarUrl: user.avatar,
    statusText: user.bio || 'Ready to play',
    level: 1, // À connecter avec ta logique d'XP/Level plus tard
    currentXp: 500,
    maxXp: 1000,
    stats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    }
  });
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
  try {
    const userId = (req as any).user?.id;
    const { username, avatar, bio } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Empêcher les doublons de username
    if (username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        //... : ne mettre à jour que les champs qui ont réellement été fournis
        ...(username && { username }),//exist and != null
        ...(avatar && { avatar }),
        ...(bio !== undefined && { bio }),//could be null if user want to clear its bio
      },
      select: { id: true, username: true, avatar: true, bio: true }
    });

    return res.json(updatedUser);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;