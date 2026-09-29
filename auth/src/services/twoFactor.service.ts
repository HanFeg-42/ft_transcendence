import QRCode from "qrcode";
import { generateSecret, generateURI } from "otplib";
import { prisma } from "../prisma";
import { verify } from "otplib";
import jwt from "jsonwebtoken";
import { createSession } from "../sessionTokens";
import type { Response } from "express";

export async function setupTwoFactor(userId: number) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const secret = generateSecret();

  const otpauthUrl = generateURI({
    issuer: "Pacova",
    label: user.email,
    secret,
  });

  const qrCode = await QRCode.toDataURL(otpauthUrl);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: false,
    },
  });

  return { qrCode };
}

export async function confirmTwoFactor(userId: number, code: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (!user.twoFactorSecret) {
    throw new Error("TWO_FACTOR_NOT_SETUP");
  }

  const result = await verify({
    secret: user.twoFactorSecret,
    token: code,
  });

  if (!result.valid) {
    throw new Error("INVALID_2FA_CODE");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
    },
  });
}

export async function disableTwoFactor(userId: number) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });
}

type TwoFactorChallengePayload = {
  userId: number;
  purpose: "2fa";
};

export async function verifyTwoFactorLogin(
  challengeToken: string,
  code: string,
  res: Response,
) {
  const challengeSecret = process.env.TWO_FACTOR_CHALLENGE_SECRET;

  if (!challengeSecret) {
    throw new Error("AUTH_SECRETS_NOT_CONFIGURED");
  }

  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(challengeToken, challengeSecret, {
      algorithms: ["HS256"],
    });
  } catch {
    throw new Error("INVALID_OR_EXPIRED_2FA_CHALLENGE");
  }

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "number" ||
    decoded.purpose !== "2fa"
  ) {
    throw new Error("INVALID_2FA_CHALLENGE");
  }

  const challenge = decoded as TwoFactorChallengePayload;

  const user = await prisma.user.findUnique({
    where: {
      id: challenge.userId,
    },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new Error("INVALID_2FA_CHALLENGE");
  }

  const result = await verify({
    secret: user.twoFactorSecret,
    token: code,
  });

  if (!result.valid) {
    throw new Error("INVALID_2FA_CODE");
  }

  const token = createSession(res, user.id);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  };
}