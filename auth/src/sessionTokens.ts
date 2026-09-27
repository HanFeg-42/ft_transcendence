import type { Response } from "express";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_LIFETIME = "15m";
const REFRESH_TOKEN_LIFETIME = "7d";
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function createSession(res: Response, userId: number): string {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error("Authentication secrets are not configured");
  }

  const accessToken = jwt.sign(
    {
      userId,
      purpose: "access",
    },
    accessSecret,
    {
      expiresIn: ACCESS_TOKEN_LIFETIME,
      algorithm: "HS256",
    },
  );

  const refreshToken = jwt.sign(
    {
      userId,
      purpose: "refresh",
    },
    refreshSecret,
    {
      expiresIn: REFRESH_TOKEN_LIFETIME,
      algorithm: "HS256",
    },
  );

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });

  return accessToken;
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth",
  });
}