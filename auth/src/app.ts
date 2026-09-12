import express from "express";
import cors from "cors";

import { register } from "./registerController";
import { login } from "./loginController";
import { authenticateToken } from "./authMiddleware";
import type { AuthenticatedRequest } from "./types/auth";
import authRoutes from './routes/auth.routes';
import { prisma } from "./prisma";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

/*
 * Basic service route
 */
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Auth service is running",
  });
});

/*
 * Health check
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth",
  });
});

/*
 * Authentication routes
 */
app.post("/register", register);
app.post("/login", login);
app.use('/42', authRoutes); // express va comparer le rest de l URL avec les racine indique dans authRoutes()

/*
 * Protected user route
 */
app.get("/me", authenticateToken, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(401).json({
      error: "Authentication invalid",
    });
  }



  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

export default app;