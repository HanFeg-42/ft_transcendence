import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Keep nginx → user service as it is. One thing is worth fixing, though: 
// your upload code builds the file extension from the name the client sends, and express.
// static picks the content type from that extension. 
// Someone could upload a file called x.html and claim the type is image/png.
//  The server would store it as .
// html and serve it as HTML,
//  which can run scripts on your site. Two small changes close that.

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const userId = getUserIdFromHeader(req as Request);
    // Extension comes from the allowed MIME type, never from the client's filename
    cb(null, `avatar_${userId}_${Date.now()}${EXT_BY_MIME[file.mimetype]}`);
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
export async function getOrCreateProfile(userId: number) {
  let profile = await prisma.profile.findUnique({ where: { userId } });

  if (!profile) {
    let displayName = `Player${userId}`;
    try {
      const authRes = await fetch(`http://auth:3001/users/${userId}`, {
        headers: { 'x-user-id': userId.toString() },
      });

      if (authRes.ok) {
        const authUser = await authRes.json();
        displayName = authUser.username;
      }
    } catch (err) {
      // console.warn('[USER] Impossible de récupérer le username depuis auth:', err);
    }

    profile = await prisma.profile.create({
      data: {
        userId,
        displayName,
        avatarUrl: '/default-avatar.png',
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


// Achievements of one user, in the shape the frontend expects
async function getUserAchievements(userId: number) {
  const achievements = await prisma.achievement.findMany({
    include: {
      users: {
        where: { userId },
        select: { unlocked: true, progress: true },
      },
    },
  });

  return achievements.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    image: a.image,
    borderColor: a.borderColor,
    textColor: a.textColor,
    unlocked: a.users[0]?.unlocked ?? false,
    progress: a.users[0]?.progress ?? 0,
  }));
}

// GET /profile/me
router.get('/me', async (req: Request, res: Response) => {
  const userId = getUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Non autorisé : Header x-user-id manquant' });
  }

  try {
    const user = await getOrCreateProfile(userId);
    const achievements = await getUserAchievements(userId);

    return res.json({
      id: user.userId,
      username: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      statusText: user.statusText || 'Ready to play',
      achievements,
    });
  } catch (err: any) {
    console.error('[USER] getMyProfile error:', err);
    return res.status(500).json({ error: err.message });
  }
});


// GET /profile/profiles?ids=1,4,7
// Returns { id, username, avatarUrl } for each requested user (max 100).
// Invalid ids are ignored; missing profiles are created.
router.get('/profiles', async (req: Request, res: Response) => {
  try {
    const raw = typeof req.query.ids === 'string' ? req.query.ids : '';
    const ids = [...new Set(raw.split(',').map(Number))]
      .filter((id) => Number.isSafeInteger(id) && id > 0)
      .slice(0, 100);

    if (ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a comma-separated list of user ids' });
    }

    // One query for existing profiles, then create only the missing ones
    const existing = await prisma.profile.findMany({ where: { userId: { in: ids } } });
    const known = new Set(existing.map((p) => p.userId));
    const created = await Promise.all(
      ids.filter((id) => !known.has(id)).map((id) => getOrCreateProfile(id)),
    );

    return res.json(
      [...existing, ...created].map((p) => ({
        id: p.userId,
        username: p.displayName,
        avatarUrl: p.avatarUrl,
      })),
    );
  } catch (err) {
    console.error('[USER] profiles failed:', err);
    return res.status(500).json({ error: 'Failed to load profiles' });
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

    if (username) {
      const cleanUsername = username.trim();

      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        return res.status(400).json({
          error: 'Username must be between 3 and 20 characters',
        });
      }

      const existing = await prisma.profile.findFirst({
        where: {
          displayName: cleanUsername,
          NOT: { userId },
        },
      });

      if (existing) {
        return res.status(400).json({
          error: 'Username already taken',
        });
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

    const achievements = await getUserAchievements(userId);
    return res.json({
      id: updated.userId,
      username: updated.displayName,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
      statusText: updated.statusText || 'Ready to play',
      achievements,
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