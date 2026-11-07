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
    _sum: { pelletsEaten: true, ghostsEaten: true },
  });
  const ghostsEaten = totals._sum.ghostsEaten ?? 0;
  const pelletsEaten = totals._sum.pelletsEaten ?? 0;
  const finished = wins + losses + draws;
  const winRate = finished ? Math.round((wins / finished) * 100) : 0;

  return {
    matchesPlayed,
    ghostsEaten,
    pelletsEaten,
    wins,
    losses,
    draws,
    winRate,
  };
};
export default findStats;
