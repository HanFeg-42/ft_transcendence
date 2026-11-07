
import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { updateUserAchievements } from "../achievement.service";

const router = Router();

router.post("/update-stats", async (req: Request, res: Response) => {
  const rawUserId = req.headers["x-user-id"];
  const userId = Number(
    Array.isArray(rawUserId) ? rawUserId[0] : rawUserId
  );

  const { result, fruitsEaten, ghostsEaten } = req.body ?? {};

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  if (!["win", "loss", "draw"].includes(result)) {
    return res.status(400).json({ error: "Invalid match result" });
  }

  if (
    !Number.isSafeInteger(fruitsEaten) ||
    fruitsEaten < 0 ||
    !Number.isSafeInteger(ghostsEaten) ||
    ghostsEaten < 0
  ) {
    return res.status(400).json({ error: "Invalid match statistics" });
  }

  try {
    // Ensure that the player's profile exists.
    await prisma.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Calculate and save achievement progress.
    const achievements = await updateUserAchievements(userId, {
      result,
      fruitsEaten,
      ghostsEaten,
    });

    return res.status(200).json({
      success: true,
      achievements,
    });
  } catch (error) {
    console.error("[USER] Achievement update failed:", error);

    return res.status(500).json({
      error: "Failed to update achievements",
    });
  }
});

export default router;
