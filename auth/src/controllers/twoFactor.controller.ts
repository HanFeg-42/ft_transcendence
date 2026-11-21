import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/auth";
import { notify } from "../notify";
import {
  setupTwoFactor as setupTwoFactorService,
  confirmTwoFactor as confirmTwoFactorService,
  disableTwoFactor as disableTwoFactorService,
  isValidTwoFactorCode,
} from "../services/twoFactor.service";

function getCode(req: Request): unknown {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return undefined;
  }

  return body.code;
}

export async function setupTwoFactor(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).userId;

  try {
    const result = await setupTwoFactorService(userId);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          error: "User not found",
        });
      }

      if (error.message === "TWO_FACTOR_ALREADY_ENABLED") {
        return res.status(409).json({
          error: "2FA is already enabled",
        });
      }
    }

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}

export async function confirmTwoFactor(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).userId;
  const code = getCode(req);

  if (!isValidTwoFactorCode(code)) {
    return res.status(400).json({
      error: "A valid 6-digit 2FA code is required",
    });
  }

  try {
    await confirmTwoFactorService(userId, code);

    void notify(userId, "two_factor_changed", { enabled: true });

    return res.status(200).json({
      message: "2FA enabled successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          error: "User not found",
        });
      }

      if (error.message === "TWO_FACTOR_ALREADY_ENABLED") {
        return res.status(409).json({
          error: "2FA is already enabled",
        });
      }

      if (error.message === "TWO_FACTOR_NOT_SETUP") {
        return res.status(400).json({
          error: "2FA setup has not been started",
        });
      }

      if (error.message === "INVALID_2FA_CODE") {
        return res.status(400).json({
          error: "Invalid 2FA code",
        });
      }
    }

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}

export async function disableTwoFactor(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).userId;
  const code = getCode(req);

  if (!isValidTwoFactorCode(code)) {
    return res.status(400).json({
      error: "A valid 6-digit 2FA code is required",
    });
  }

  try {
    await disableTwoFactorService(userId, code);

    void notify(userId, "two_factor_changed", { enabled: false });

    return res.status(200).json({
      message: "2FA disabled successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          error: "User not found",
        });
      }

      if (error.message === "TWO_FACTOR_NOT_ENABLED") {
        return res.status(400).json({
          error: "2FA is not enabled",
        });
      }

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
    }

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}
