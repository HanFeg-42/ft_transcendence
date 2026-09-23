import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { register } from "./registerController";
import { login } from "./loginController";
import { authenticateToken } from "./authMiddleware";
import type { AuthenticatedRequest } from "./types/auth";
import authRoutes from "./routes/auth.routes";
import { prisma } from "./prisma";
import {
  setupTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
} from "./twoFactorController";
import { verifyTwoFactorLogin } from "./2faLoginController";
import { refreshSession, logoutSession } from "./sessionController";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Auth service is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth",
  });
});

app.post("/register", register);
app.post("/login", login);
app.post("/refresh", refreshSession);
app.post("/logout", logoutSession);
app.use("/42", authRoutes); // express va comparer le rest de l URL avec les racine indique dans authRoutes()

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
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });
});

app.post("/2fa/setup", authenticateToken, setupTwoFactor);
app.post("/2fa/confirm", authenticateToken, confirmTwoFactor);
app.post("/2fa/verify-login", verifyTwoFactorLogin);
app.post("/2fa/disable", authenticateToken, disableTwoFactor);

export default app;
