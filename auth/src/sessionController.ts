import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "./prisma";
import { clearRefreshCookie, createSession } from "./sessionTokens";

type RefreshTokenPayload = {
  userId: number;
  purpose: "refresh";
};

export async function refreshSession(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");

  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!accessSecret || !refreshSecret) {
    console.error("Authentication secrets are not configured");

    return res.status(500).json({
      error: "Something went wrong",
    });
  }

  const refreshToken = req.cookies?.refresh_token;

  if (typeof refreshToken !== "string") {
    return res.status(401).json({
      error: "No valid session",
    });
  }

  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(refreshToken, refreshSecret, {
      algorithms: ["HS256"],
    });
  } catch {
    clearRefreshCookie(res);

    return res.status(401).json({
      error: "Invalid or expired session",
    });
  }

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "number" ||
    decoded.purpose !== "refresh"
  ) {
    clearRefreshCookie(res);

    return res.status(401).json({
      error: "Invalid session",
    });
  }

  const payload = decoded as RefreshTokenPayload;

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!user) {
    clearRefreshCookie(res);

    return res.status(401).json({
      error: "Invalid session",
    });
  }

  const token = createSession(res, user.id);

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      avatar: user.avatar,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });
}

export function logoutSession(_req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");

  clearRefreshCookie(res);

  return res.status(200).json({
    message: "Logged out successfully",
  });
}