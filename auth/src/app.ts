import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import type { AuthenticatedRequest } from "./types/auth";
import authRoutes from "./routes/auth.routes";
import usersRoutes from './routes/users.routes';
import { login } from "./controllers/auth.controller";
import { prisma } from "./prisma";
import { register } from "./controllers/register.controller";
import { authenticateToken } from "./middleware/auth.middleware";
import { verifyTwoFactorLogin } from "./controllers/twoFactorLogin.controller";
import {
  refreshSession,
  logoutSession,
} from "./controllers/session.controller";
import {
  setupTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
} from "./controllers/twoFactor.controller";

const app = express();

app.disable("x-powered-by");

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
app.use('/users', usersRoutes);

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

// Fix #6: JSON parse errors etc. must not leak an HTML stack trace.
// (Keep this AFTER all routes.)
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  const status =
    typeof (err as { status?: unknown })?.status === "number" &&
    (err as { status: number }).status >= 400 &&
    (err as { status: number }).status < 500
      ? (err as { status: number }).status
      : 500;

  return res.status(status).json({
    error: status === 500 ? "Something went wrong" : "Invalid request",
  });
});

export default app;
