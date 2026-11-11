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
  const draws = await prisma.matchParticipant.count({
    where: { userId, result: "DRAW" },
  });
  const totals = await prisma.matchParticipant.aggregate({
    where: { userId },
    _sum: { pelletsEaten: true, fruitsEaten: true, ghostsEaten: true },
  });
  const pelletsEaten = totals._sum.pelletsEaten ?? 0;
  const fruitsEaten = totals._sum.fruitsEaten ?? 0;
  const ghostsEaten = totals._sum.ghostsEaten ?? 0;
  const finishedMatches = wins + losses + draws;
  const winRate = finishedMatches ? Math.round((wins / finishedMatches) * 100) : 0;

  return {
    matchesPlayed,
    pelletsEaten,
    fruitsEaten,
    ghostsEaten,
    wins,
    losses,
    draws,
    winRate,
  };
};
export default findStats;
