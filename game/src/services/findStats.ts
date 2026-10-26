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
  const pelletsEaten = totals._sum.pelletsEaten;
  const fruitsEaten = totals._sum.fruitsEaten;
  const ghostsEaten = totals._sum.ghostsEaten;
  const winRate = matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0;

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
