import express from "express";
import cors from "cors";

import { register } from "./registerController";
import { login } from "./loginController";
import { authenticateToken } from "./authMiddleware";
import type { AuthenticatedRequest } from "./types/auth";
import { prisma } from "./prisma";

const app = express();

const PORT = process.env.PORT || 3001;

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
 *
 * Useful for Docker / infrastructure to verify
 * that the auth service is alive.
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

app.listen(PORT, () => {
  console.log(`[AUTH] Service running on port ${PORT}`);
});