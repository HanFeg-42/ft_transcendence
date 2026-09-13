import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verify } from "otplib";

import { prisma } from "./prisma";

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

  const jwtSecret = process.env.JWT_SECRET;
  const challengeSecret = process.env.TWO_FACTOR_CHALLENGE_SECRET;

  if (!jwtSecret || !challengeSecret) {
    console.error("JWT secrets are not configured");

    return res.status(500).json({
      error: "Something went wrong",
    });
  }

  try {
    // 1. Verify the temporary token created after password login.
    const decoded = jwt.verify(challengeToken, challengeSecret, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "number" ||
      decoded.purpose !== "2fa"
    ) {
      return res.status(401).json({
        error: "Invalid 2FA challenge",
      });
    }

    const challenge = decoded as TwoFactorChallengePayload;

    // 2. Find the user whose password was already verified.
    const user = await prisma.user.findUnique({
      where: {
        id: challenge.userId,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(401).json({
        error: "Invalid 2FA challenge",
      });
    }

    // 3. Verify the current authenticator code.
    const result = await verify({
      secret: user.twoFactorSecret,
      token: code,
    });

    if (!result.valid) {
      return res.status(401).json({
        error: "Invalid 2FA code",
      });
    }

    // 4. Both factors succeeded.
    // Now we can finally issue the normal authentication JWT.
    const token = jwt.sign(
      {
        userId: user.id,
      },
      jwtSecret,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      },
    );

    return res.status(200).json({
      message: "Login successful",
      token,
user: {
  id: user.id,
  username: user.username,
  email: user.email,
  twoFactorEnabled: user.twoFactorEnabled,
},
    });
  } catch {
    return res.status(401).json({
      error: "Invalid or expired 2FA challenge",
    });
  }
}
