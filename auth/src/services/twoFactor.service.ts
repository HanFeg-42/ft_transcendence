import QRCode from "qrcode";
import { generateSecret, generateURI, verify } from "otplib";
import jwt from "jsonwebtoken";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../prisma";
import { createSession } from "../sessionTokens";
import type { Response } from "express";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

type User = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

// otplib types its result as a union (HOTP | TOTP); only TOTP has timeStep.
function getTimeStep(result: object): number {
  if ("timeStep" in result && typeof result.timeStep === "number") {
    return result.timeStep;
  }

  throw new Error("INVALID_2FA_CODE");
}

export function isValidTwoFactorCode(code: unknown): code is string {
  return typeof code === "string" && /^\d{6}$/.test(code);
}

/**
 * Checks a TOTP code for a user who already has 2FA enabled.
 *  - refuses while the account is locked (too many wrong codes)
 *  - counts wrong codes and locks after MAX_FAILED_ATTEMPTS
 *  - rejects a code (time step) that was already used
 * `extraWhere` / `extraData` let the caller make extra checks / writes part of
 * the same atomic update (used to consume the login challenge).
 */
async function verifyCodeWithProtection(
  user: User,
  code: string,
  extraWhere: Prisma.UserWhereInput = {},
  extraData: Prisma.UserUpdateManyMutationInput = {},
) {
  if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > new Date()) {
    throw new Error("TWO_FACTOR_LOCKED");
  }

  if (!user.twoFactorSecret) {
    throw new Error("TWO_FACTOR_NOT_SETUP");
  }

  const result = await verify({
    secret: user.twoFactorSecret,
    token: code,
    // a code from a time step we already accepted is rejected (anti-replay)
    afterTimeStep: user.twoFactorLastUsedStep ?? undefined,
  });

  if (!result.valid) {
    // atomic increment: parallel requests cannot dodge the counter
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorFailedAttempts: { increment: 1 } },
    });

    if (updated.twoFactorFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorFailedAttempts: 0,
          twoFactorLockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
        },
      });
      throw new Error("TWO_FACTOR_LOCKED");
    }

    throw new Error("INVALID_2FA_CODE");
  }

  const timeStep = getTimeStep(result);

  // Claim this time step (and the challenge) atomically. If a parallel request
  // already claimed it, count = 0 and we refuse.
  const claimed = await prisma.user.updateMany({
    where: {
      id: user.id,
      AND: [
        {
          OR: [
            { twoFactorLastUsedStep: null },
            { twoFactorLastUsedStep: { lt: timeStep } },
          ],
        },
        extraWhere,
      ],
    },
    data: {
      twoFactorLastUsedStep: timeStep,
      twoFactorFailedAttempts: 0,
      twoFactorLockedUntil: null,
      ...extraData,
    },
  });

  if (claimed.count === 0) {
    throw new Error("INVALID_2FA_CODE");
  }
}

export async function setupTwoFactor(userId: number) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Fix #1: setup must not be able to replace the secret / switch 2FA off
  // while it is enabled. To re-do it, the user has to disable it first
  // (which needs a valid code).
  if (user.twoFactorEnabled) {
    throw new Error("TWO_FACTOR_ALREADY_ENABLED");
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

  if (user.twoFactorEnabled) {
    throw new Error("TWO_FACTOR_ALREADY_ENABLED");
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
      // the code used to confirm cannot be reused to log in right away
      twoFactorLastUsedStep: getTimeStep(result),
      twoFactorFailedAttempts: 0,
      twoFactorLockedUntil: null,
    },
  });
}

// Fix #2: disabling needs a valid current 2FA code (and shares the lockout).
export async function disableTwoFactor(userId: number, code: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new Error("TWO_FACTOR_NOT_ENABLED");
  }

  await verifyCodeWithProtection(user, code);

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorLastUsedStep: null,
        twoFactorFailedAttempts: 0,
        twoFactorLockedUntil: null,
      },
    }),
    prisma.twoFactorRecoveryCode.deleteMany({
      where: { userId },
    }),
  ]);
}

type TwoFactorChallengePayload = {
  userId: number;
  purpose: "2fa";
  issuedAtMs: number;
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
    typeof decoded.issuedAtMs !== "number" ||
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

  const issuedAt = new Date(challenge.issuedAtMs);

  // Fix #3 (one-time use): a challenge older than (or equal to) the last one
  // consumed for this user is dead.
  if (
    user.twoFactorChallengeConsumedAt &&
    issuedAt <= user.twoFactorChallengeConsumedAt
  ) {
    throw new Error("INVALID_OR_EXPIRED_2FA_CHALLENGE");
  }

  await verifyCodeWithProtection(
    user,
    code,
    {
      OR: [
        { twoFactorChallengeConsumedAt: null },
        { twoFactorChallengeConsumedAt: { lt: issuedAt } },
      ],
    },
    { twoFactorChallengeConsumedAt: issuedAt },
  );

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
