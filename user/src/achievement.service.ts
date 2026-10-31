import { prisma } from "./prisma";

const ACHIEVEMENT_TARGETS = {
  champion: 2,
  "ghost-hunter": 50,
  "cherry-collector": 200,
  "pac-maniac": 500,
} as const;

interface OnlineMatchStats {
  result: "win" | "loss" | "draw";
  fruitsEaten: number;
  ghostsEaten: number;
}

export async function updateUserAchievements(
  userId: number,
  matchStats: OnlineMatchStats
) {
  const increments: Record<string, number> = {
    champion: matchStats.result === "win" ? 1 : 0,
    "ghost-hunter": matchStats.ghostsEaten,
    "cherry-collector": matchStats.fruitsEaten,
    "pac-maniac": 1,
  };

  return prisma.$transaction(async (tx) => {
    const results = [];

    for (const [achievementId, target] of Object.entries(
      ACHIEVEMENT_TARGETS
    )) {
      const current = await tx.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId,
          },
        },
      });

      const currentValue = current?.progress ?? 0;
      const increment = increments[achievementId] ?? 0;

      const newValue = Math.min(target, currentValue + increment);
      const newlyUnlocked = newValue >= target && !current?.unlocked;

      const updated = await tx.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId,
          },
        },
        create: {
          userId,
          achievementId,
          progress: newValue,
          unlocked: newValue >= target,//////////////////
          unlockedAt: newValue >= target ? new Date() : null,
        },
        update: {
          progress: newValue,
          unlocked: newValue >= target || current?.unlocked === true,
          ...(newlyUnlocked && { unlockedAt: new Date() }),
        },
      });

      results.push({
        achievementId,
        progress: updated.progress,
        target,
        unlocked: updated.unlocked,
      });
    }

    return results;
  });
}
