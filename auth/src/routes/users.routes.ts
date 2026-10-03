import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /users — Return public information for all users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return res.json(users);
  } catch (err: any) {
    console.error('[AUTH] getUsers error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /users/:id — Retourne les infos publiques d'un utilisateur
router.get('/:id', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (err: any) {
    console.error('[AUTH] getUserById error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;