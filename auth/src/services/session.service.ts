import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

type RefreshTokenPayload = {
  userId: number;
  purpose: "refresh";
};

export async function refreshUserSession(refreshToken: string) {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!refreshSecret) {
    throw new Error("AUTH_SECRETS_NOT_CONFIGURED");
  }

  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(refreshToken, refreshSecret, {
      algorithms: ["HS256"],
    });
  } catch {
    throw new Error("INVALID_OR_EXPIRED_SESSION");
  }

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "number" ||
    decoded.purpose !== "refresh"
  ) {
    throw new Error("INVALID_SESSION");
  }

  const payload = decoded as RefreshTokenPayload;

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!user) {
    throw new Error("INVALID_SESSION");
  }

  return user;
}