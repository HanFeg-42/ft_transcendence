
import { prisma } from '../src/prisma';

const ACHIEVEMENTS = [
  {
    id: 'champion',
    title: 'CHAMPION',
    description: '--',
    image: 'champion.png',
    borderColor: 'border-yellow-400',
    textColor: 'text-amber-400',
  },
  {
    id: 'ghost-hunter',
    title: 'GHOST HUNTER',
    description: '--',
    image: 'ghost-hanter.png',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-500',
  },
  {
    id: 'cherry-collector',
    title: 'CHERRY COLLECTOR',
    description: '--',
    image: 'cherrys.png',
    borderColor: 'border-red-500',
    textColor: 'text-red-500',
  },
  {
    id: 'pac-maniac',
    title: 'PAC-MANIAC',
    description: '--',
    image: 'pac-maniac.png',
    borderColor: 'border-blue-400',
    textColor: 'text-cyan-400',
  },
];

async function main() {
  const activeIds = ACHIEVEMENTS.map((achievement) => achievement.id);

  // Delete obsolete achievements only.
  // Related UserAchievement records are deleted through onDelete: Cascade.
  await prisma.achievement.deleteMany({
    where: {
      id: {
        notIn: activeIds,
      },
    },
  });

  // Create missing achievements or update existing ones.
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: {
        id: achievement.id,
      },
      update: {
        title: achievement.title,
        description: achievement.description,
        image: achievement.image,
        borderColor: achievement.borderColor,
        textColor: achievement.textColor,
      },
      create: achievement,
    });
  }

  console.log('Successfully seeded the 4 active achievements.');
}

main()
  .catch((error) => {
    console.error('Failed to seed achievements:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
