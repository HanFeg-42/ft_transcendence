import { prisma } from "../prisma";

const findMatchHistory = async (userId: number, limit: number, offset: number) =>
  await prisma.matchParticipant.findMany({
    where: { userId },
    orderBy: { matchId: "desc" },
    take: limit,
    skip: offset,
    include: { match: { include: { participants: true } } },
  });
export default findMatchHistory;
