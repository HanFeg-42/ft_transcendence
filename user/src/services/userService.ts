import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return {
    ...user,
    level: 1,
    currentXp: 0,
    maxXp: 1000,
    stats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    },
  };
}