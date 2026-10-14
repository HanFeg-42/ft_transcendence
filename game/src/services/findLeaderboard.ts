import { prisma } from "../prisma";

const findLeaderboard = async (limit: number) => {
  const rows = await prisma.matchParticipant.groupBy({
    by: ["userId"],
    where: { result: "WIN" },
    _count: { userId: true },
    orderBy: { _count: { userId: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({
    userId: r.userId,
    wins: r._count.userId,
  }));
};
export default findLeaderboard;
