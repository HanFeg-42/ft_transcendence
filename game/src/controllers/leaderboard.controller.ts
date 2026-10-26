import { Request, Response } from "express";
import findLeaderboard from "../services/findLeaderboard";

const getLeaderboard = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 100)
  try {
    return res.json(await findLeaderboard(limit));
  } catch (e) {
    console.error("[GAME-SERVICE] Failed to fetch leaderboard:", e);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

export default getLeaderboard;
