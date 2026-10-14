import { Request, Response } from "express";
import findMatchHistory from "../services/findMatchHistory";

const getMatchHistory = async (req: Request, res: Response) => {
  const userId = Number(req.params.id ?? req.headers["x-user-id"]);
  const limit = Math.min(Number(req.query.limit) || 5, 50);
  const offset = Number(req.query.offset) || 0;

  if (!Number.isInteger(userId) || userId < 1)
    return res.status(400).json({ error: "Invalid user id" });
  try {
    return res.json(await findMatchHistory(userId, limit, offset));
  } catch (e) {
    console.error("[GAME-SERVICE] Failed to fetch match history:", e);
    return res.status(500).json({ error: "Failed to fetch match history" });
  }
};

export default getMatchHistory;