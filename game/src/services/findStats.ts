import { prisma } from "../prisma";

const findStats = async (userId: number) => {
  const matchesPlayed = await prisma.matchParticipant.count({
    where: { userId },
  });
  const wins = await prisma.matchParticipant.count({
    where: { userId, result: "WIN" },
  });
  const losses = await prisma.matchParticipant.count({
    where: { userId, result: "LOSS" },
  });

  const winRate = matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0;

  return { matchesPlayed, wins, losses, winRate };
};
export default findStats;
