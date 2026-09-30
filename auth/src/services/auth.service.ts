import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../prisma";
import { createSession } from "../sessionTokens";

export async function loginUser(
  email: string,
  password: string,
  res: Response,
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordIsValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET_NOT_CONFIGURED");
  }

  if (user.twoFactorEnabled) {
    const challengeSecret = process.env.TWO_FACTOR_CHALLENGE_SECRET;

    if (!challengeSecret) {
      throw new Error("TWO_FACTOR_CHALLENGE_SECRET_NOT_CONFIGURED");
    }

    const challengeToken = jwt.sign(
      {
        userId: user.id,
        purpose: "2fa",
      },
      challengeSecret,
      {
        expiresIn: "5m",
        algorithm: "HS256",
      },
    );

    return {
      requiresTwoFactor: true,
      challengeToken,
    };
  }

  const token = createSession(res, user.id);

  return {
    requiresTwoFactor: false,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  };
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
) {
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    throw error;
  }
}
