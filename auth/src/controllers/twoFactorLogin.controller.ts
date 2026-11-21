import type { Request, Response } from "express";
import {
  verifyTwoFactorLogin as verifyTwoFactorLoginService,
  isValidTwoFactorCode,
} from "../services/twoFactor.service";

export async function verifyTwoFactorLogin(req: Request, res: Response) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      error: "Invalid request body",
    });
  }

  const { challengeToken, code } = body;

  if (typeof challengeToken !== "string" || !challengeToken) {
    return res.status(400).json({
      error: "Challenge token is required",
    });
  }

  if (!isValidTwoFactorCode(code)) {
    return res.status(400).json({
      error: "A valid 6-digit 2FA code is required",
    });
  }

  try {
    const result = await verifyTwoFactorLoginService(challengeToken, code, res);

    return res.status(200).json({
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TWO_FACTOR_LOCKED") {
        return res.status(429).json({
          error: "Too many failed attempts. Try again later.",
        });
      }

      if (error.message === "INVALID_2FA_CODE") {
        return res.status(401).json({
          error: "Invalid 2FA code",
        });
      }

      if (
        error.message === "INVALID_2FA_CHALLENGE" ||
        error.message === "INVALID_OR_EXPIRED_2FA_CHALLENGE"
      ) {
        return res.status(401).json({
          error:
            error.message === "INVALID_OR_EXPIRED_2FA_CHALLENGE"
              ? "Invalid or expired 2FA challenge"
              : "Invalid 2FA challenge",
        });
      }
    }

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}
