import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';




const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const userId = getUserIdFromHeader(req as Request);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, GIF, WEBP allowed'));
  },
});

const router = Router();

function getUserIdFromHeader(req: Request): number | null {
  const userId = req.headers['x-user-id'];
  if (!userId) return null;
  const id = parseInt(Array.isArray(userId) ? userId[0] : userId, 10);
  return isNaN(id) ? null : id;
}

// Helper : récupère ou crée le Profile
async function getOrCreateProfile(userId: number) {
  let profile = await prisma.profile.findUnique({ where: { userId } });
  
  if (!profile) {
    let displayName = `Player${userId}`;
    let avatarUrl = null;  // in case of fail
    try {
      const authRes = await fetch(`http://auth:3001/users/${userId}`, {
        headers: { 'x-user-id': userId.toString() },
      });
      
      if (authRes.ok) {
        const authUser = await authRes.json();
        displayName = authUser.username;
        avatarUrl = authUser.avatar ?? null;
      }
    } catch (err) {
      console.warn('[USER] Impossible de récupérer le username depuis auth:', err);
    }
    
    profile = await prisma.profile.create({
      data: {
        userId,
        displayName,
        avatarUrl,
        bio: '',
        statusText: 'Ready to play',
      },
    });
  
  
    const achievements = await prisma.achievement.findMany();
    await prisma.userAchievement.createMany({
      data: achievements.map((a) => ({
        userId,
        achievementId: a.id,
        progress: 0,
        unlocked: false,
      })),
      skipDuplicates: true,
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

    const achievements = await prisma.achievement.findMany({
      include: {
        users: {
          where: { userId },
          select: { unlocked: true, progress: true, unlockedAt: true },
        },
      },
    });

    const formattedAchievements = achievements.map((a) => {
      const userProgress = a.users[0];
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        image: a.image,
        borderColor: a.borderColor,
        textColor: a.textColor,
        unlocked: userProgress?.unlocked ?? false,
        progress: userProgress?.progress ?? 0,
      };
    });

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
      achievements: formattedAchievements,
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

    const achievements = await prisma.achievement.findMany({
      include: {
        users: {
          where: { userId },
          select: { unlocked: true, progress: true, unlockedAt: true },
        },
      },
    });

    const formattedAchievements = achievements.map((a) => {
      const userProgress = a.users[0];
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        image: a.image,
        borderColor: a.borderColor,
        textColor: a.textColor,
        unlocked: userProgress?.unlocked ?? false,
        progress: userProgress?.progress ?? 0,
      };
    });

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
      achievements: formattedAchievements,
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

    const updated = await prisma.profile.update({
      where: { userId },
      data: {
        ...(username !== undefined && { displayName: username || null }),
        ...(avatar !== undefined && { avatarUrl: avatar || null }),
        ...(bio !== undefined && { bio }),
      },
    });

    const achievements = await prisma.achievement.findMany({
      include: {
        users: {
          where: { userId },
          select: { unlocked: true, progress: true, unlockedAt: true },
        },
      },
    });

    const formattedAchievements = achievements.map((a) => {
      const userProgress = a.users[0];
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        image: a.image,
        borderColor: a.borderColor,
        textColor: a.textColor,
        unlocked: userProgress?.unlocked ?? false,
        progress: userProgress?.progress ?? 0,
      };
    });

    return res.json({
      id: updated.userId,
      username: updated.displayName,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
      statusText: updated.statusText || 'Ready to play',
      level: 1,
      currentXp: 500,
      maxXp: 1000,
      stats: { matchesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
      achievements: formattedAchievements,
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  const userId = getUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  try {
    await prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
    });

    return res.json({ avatarUrl });
  } catch (err: any) {
    console.error('[USER] uploadAvatar error:', err);
    return res.status(500).json({ error: err.message });
  }
});


// Objet créé par Multer :

// {
//   fieldname: 'avatar',
//   originalname: 'photo.jpg',
//   filename: 'avatar_1_1735689600000.jpg',
//   path: '/app/user/uploads/avatars/avatar_1_xxx.jpg',
//   size: 12345,
//   mimetype: 'image/jpeg',
// }

export default router;