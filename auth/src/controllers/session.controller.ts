import type { Request, Response } from "express";
import { clearRefreshCookie, createSession } from "../sessionTokens";
import { refreshUserSession } from "../services/session.service";

type RefreshTokenPayload = {
  userId: number;
  purpose: "refresh";
};

export async function refreshSession(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");

  const refreshToken = req.cookies?.refresh_token;

  if (typeof refreshToken !== "string") {
    return res.status(401).json({
      error: "No valid session",
    });
  }

  try {
    const user = await refreshUserSession(refreshToken);

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
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "AUTH_SECRETS_NOT_CONFIGURED") {
        console.error("Authentication secrets are not configured");

        return res.status(500).json({
          error: "Something went wrong",
        });
      }

      if (error.message === "INVALID_OR_EXPIRED_SESSION") {
        clearRefreshCookie(res);

        return res.status(401).json({
          error: "Invalid or expired session",
        });
      }

      if (error.message === "INVALID_SESSION") {
        clearRefreshCookie(res);

        return res.status(401).json({
          error: "Invalid session",
        });
      }
    }

    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}

export function logoutSession(_req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");

  clearRefreshCookie(res);

  return res.status(200).json({
    message: "Logged out successfully",
  });
}