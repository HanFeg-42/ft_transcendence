import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  { id: 'champion',          title: 'CHAMPION',          description: 'Win 100 matches',         image: 'champion.png',      borderColor: 'border-amber-400',  textColor: 'text-amber-400' },
  { id: 'ghost-hunter',      title: 'GHOST HUNTER',      description: 'Defeat 50 ghosts',        image: 'ghost-hanter.png',  borderColor: 'border-pink-500',   textColor: 'text-pink-500' },
  { id: 'cherry-collector',  title: 'CHERRY COLLECTOR',  description: 'Collect 200 cherries',    image: 'cherrys.png',       borderColor: 'border-red-500',    textColor: 'text-red-500' },
  { id: 'speedster',         title: 'SPEEDSTER',         description: 'Win 10 matches in a row', image: 'speeder.png',       borderColor: 'border-yellow-400', textColor: 'text-yellow-400' },
  { id: 'pac-maniac',        title: 'PAC-MANIAC',        description: 'Play 500 matches',        image: 'pac-maniac.png',    borderColor: 'border-cyan-400',   textColor: 'text-cyan-400' },
  { id: 'tournament-player', title: 'TOURNAMENT PLAYER', description: 'Join 10 tournaments',     image: 'tournament.png',    borderColor: 'border-purple-500', textColor: 'text-purple-500' },
];

async function main() {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { id: a.id },
      update: a,
      create: a,
    });
  }
  console.log('✅ Achievements seeded');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());