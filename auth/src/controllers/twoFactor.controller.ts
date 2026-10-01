import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/auth";
import { verify } from "otplib";
import { prisma } from "../prisma";
import {
  setupTwoFactor as setupTwoFactorService,
  confirmTwoFactor as confirmTwoFactorService,
  disableTwoFactor as disableTwoFactorService,
} from "../services/twoFactor.service";

export async function setupTwoFactor(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).userId;

  try {
    const result = await setupTwoFactorService(userId);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "User not found",
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}

export async function confirmTwoFactor(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).userId;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      error: "2FA code is required",
    });
  }

  try {
    await confirmTwoFactorService(userId, code);

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

    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}

export async function disableTwoFactor(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).userId;

  try {
    await disableTwoFactorService(userId);

    return res.status(200).json({
      message: "2FA disabled successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "User not found",
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}
