import type { Request, Response } from "express";
import { verifyTwoFactorLogin as verifyTwoFactorLoginService } from "../services/twoFactor.service";

type TwoFactorChallengePayload = {
  userId: number;
  purpose: "2fa";
};

export async function verifyTwoFactorLogin(req: Request, res: Response) {
  const { challengeToken, code } = req.body;

  if (!challengeToken || !code) {
    return res.status(400).json({
      error: "Challenge token and 2FA code are required",
    });
  }

  try {
    const result = await verifyTwoFactorLoginService(
      challengeToken,
      code,
      res,
    );

    return res.status(200).json({
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "AUTH_SECRETS_NOT_CONFIGURED") {
        console.error("JWT secrets are not configured");

        return res.status(500).json({
          error: "Something went wrong",
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

    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}
