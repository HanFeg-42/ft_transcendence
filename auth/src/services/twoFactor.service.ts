import QRCode from "qrcode";
import { generateSecret, generateURI } from "otplib";
import { prisma } from "../prisma";
import { verify } from "otplib";

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