import { Router } from "express"
import getStats from "../controllers/stats.controller"

const statsRoutes = Router();

statsRoutes.get("/:id?", getStats);

export default statsRoutes;