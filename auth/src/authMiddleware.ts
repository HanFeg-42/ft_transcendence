import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { verify } from "otplib";
import type { AuthenticatedRequest } from "./types/auth";
import { prisma } from "./prisma";

const RECENT_AUTHENTICATION_WINDOW_SECONDS = 5 * 60;

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const authToken = authHeader.split(" ")[1];

  if (!authToken) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({
      error: "Something went wrong",
    });
  }

  try {
    const decoded = jwt.verify(authToken, jwtSecret, {
      algorithms: ["HS256"],
    });

    if (typeof decoded === "string" || typeof decoded.userId !== "number") {
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    const authenticatedRequest = req as AuthenticatedRequest;
    authenticatedRequest.userId = decoded.userId;
    authenticatedRequest.authenticatedAt = decoded.iat;

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

export async function requireRecentAuthentication(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { userId, authenticatedAt } = req as AuthenticatedRequest;
  const now = Math.floor(Date.now() / 1000);

  if (
    typeof authenticatedAt === "number" &&
    authenticatedAt <= now &&
    now - authenticatedAt <= RECENT_AUTHENTICATION_WINDOW_SECONDS
  ) {
    return next();
  }

  const code = typeof req.body?.code === "string" ? req.body.code : undefined;
  const password =
    typeof req.body?.password === "string" ? req.body.password : undefined;

  if (!code && !password) {
    return res.status(401).json({
      error: "Recent authentication required",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(401).json({
      error: "Recent authentication required",
    });
  }

  let reauthenticated = false;

  if (password && user.passwordHash) {
    reauthenticated = await bcrypt.compare(password, user.passwordHash);
  }

  if (!reauthenticated && code && user.twoFactorEnabled && user.twoFactorSecret) {
    const result = await verify({
      secret: user.twoFactorSecret,
      token: code,
    });

    reauthenticated = result.valid;
  }

  if (!reauthenticated) {
    return res.status(401).json({
      error: "Recent authentication required",
    });
  }

  return next();
}
