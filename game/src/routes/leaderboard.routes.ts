import { Router } from "express";
import getLeaderboard from "../controllers/leaderboard.controller";

const leaderboardRoutes = Router();

leaderboardRoutes.get("/", getLeaderboard);

export default leaderboardRoutes;