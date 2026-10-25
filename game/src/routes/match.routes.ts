import { Router } from "express";
import getMatchHistory from "../controllers/match.controller";

const matchRoutes = Router();

matchRoutes.get("/:id?", getMatchHistory);

export default matchRoutes;
