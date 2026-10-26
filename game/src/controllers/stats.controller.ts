import { Request, Response } from "express";
import findStats from "../services/findStats";


const getStats = async (req: Request, res: Response) => {
  const userId = Number(req.params.id ?? req.headers["x-user-id"]);
  if (!Number.isInteger(userId) || userId < 1)
    return res.status(400).json({ error: "Invalid user id" });
  try {
    return res.json(await findStats(userId));
  } catch (e) {
    console.error("[GAME-SERVICE] Failed to fetch stats:", e);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export default getStats;