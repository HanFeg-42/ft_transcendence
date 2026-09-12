import type { Request, Response } from "express";
import QRCode from "qrcode";
import { generateSecret, generateURI } from "otplib";
import { prisma } from "./prisma";
import type { AuthenticatedRequest } from "./types/auth";
import { verify } from "otplib";

export async function setupTwoFactor(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
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

  return res.status(200).json({
    qrCode,
  });
}

export async function confirmTwoFactor(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).userId;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      error: "2FA code is required",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  if (!user.twoFactorSecret) {
    return res.status(400).json({
      error: "2FA setup has not been started",
    });
  }

  const result = await verify({
    secret: user.twoFactorSecret,
    token: code,
  });

  if (!result.valid) {
    return res.status(400).json({
      error: "Invalid 2FA code",
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
    },
  });

  return res.status(200).json({
    message: "2FA enabled successfully",
  });
}
