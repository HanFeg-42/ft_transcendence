import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { randomBytes } from "node:crypto";
import { createSession } from "../sessionTokens";

interface FortyTwoUser {
  id: number;
  login: string;
  email: string;
}

type OAuthLoginResult =
  | {
      requiresTwoFactor: true;
      challengeToken: string;
    }
  | {
      requiresTwoFactor: false;
      // token: string;
      user: {
        id: number;
        username: string;
        email: string;
        twoFactorEnabled: boolean;
      };
    };

const oauthTickets = new Map<
  string,
  { result: OAuthLoginResult; expiresAt: number }
>();

function createOAuthTicket(result: OAuthLoginResult): string {
  const now = Date.now();

  for (const [ticket, entry] of oauthTickets) {
    if (entry.expiresAt <= now) {
      oauthTickets.delete(ticket);
    }
  }

  const ticket = randomBytes(32).toString("hex");

  oauthTickets.set(ticket, {
    result,
    expiresAt: now + 60_000,
  });

  return ticket;
}

export const exchangeOAuthTicket = (req: Request, res: Response): void => {
  res.setHeader("Cache-Control", "no-store");

  const ticket = req.body?.ticket;

  if (typeof ticket !== "string") {
    res.status(400).json({ error: "OAuth ticket is required" });
    return;
  }

  const entry = oauthTickets.get(ticket);

  oauthTickets.delete(ticket);

  if (!entry || entry.expiresAt <= Date.now()) {
    res.status(401).json({ error: "OAuth login expired. Please try again." });
    return;
  }

  if (entry.result.requiresTwoFactor) {
    res.status(200).json(entry.result);
    return;
  }

  const token = createSession(res, entry.result.user.id);

  res.status(200).json({
    ...entry.result,
    token,
  });
};


export const redirectTo42 = (req: Request, res: Response): void => {
  const state = randomBytes(32).toString("hex");

  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth/42",
    maxAge: 5 * 60 * 1000,
  });

  // On construit l'URL officielle de 42 avec nos paramètres
  const fortyTwoAuthUrl =
    `https://api.intra.42.fr/oauth/authorize?` +
    `client_id=${process.env.FORTYTWO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.FORTYTWO_CALLBACK_URL || "")}` +
    `&response_type=code` +
    `&state=${state}`;

  res.redirect(fortyTwoAuthUrl);
};

export const handle42Callback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { code, error, state } = req.query;

  const expectedState = req.headers.cookie
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("oauth_state="))
    ?.slice("oauth_state=".length);

  res.clearCookie("oauth_state", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth/42",
  });

  if (typeof state !== "string" || !expectedState || state !== expectedState) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    return;
  }

  if (error || typeof code !== "string" || !code) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_cancelled`);
    return;
  }

  try {
    const tokenResponse = await fetch("https://api.intra.42.fr/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.FORTYTWO_CLIENT_ID,
        client_secret: process.env.FORTYTWO_CLIENT_SECRET,
        code: code as string, // "as string" informe TypeScript que code est du texte
        redirect_uri: process.env.FORTYTWO_CALLBACK_URL,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(
        tokenData.error_description || "Échec de la récupération du token 42",
      );
    }

    const fortyTwoAccessToken: string = tokenData.access_token;

    const userResponse = await fetch("https://api.intra.42.fr/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${fortyTwoAccessToken}`,
      },
    });

    const ftData: FortyTwoUser = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error(
        "Impossible de récupérer le profil utilisateur depuis 42",
      );
    }

    let user = await prisma.user.findUnique({
      where: { fortyTwoId: ftData.id },
    });

    if (!user) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: ftData.email },
      });

      if (existingEmail) {
        res.redirect(
          `${process.env.FRONTEND_URL}/login?error=oauth_account_exists`,
        );
        return;
      }

      const existingUsername = await prisma.user.findUnique({
        where: { username: ftData.login },
      });

      const username = existingUsername
        ? `${ftData.login}_${randomBytes(8).toString("hex")}`
        : ftData.login;

            user = await prisma.user.create({
        data: {
          username,
          email: ftData.email,
          fortyTwoId: ftData.id,
        },
      });
    }
    
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    let result: OAuthLoginResult;

    if (user.twoFactorEnabled) {
      const challengeSecret = process.env.TWO_FACTOR_CHALLENGE_SECRET;

      if (!challengeSecret) {
        throw new Error("TWO_FACTOR_CHALLENGE_SECRET is not configured");
      }

      const challengeToken = jwt.sign(
        { userId: user.id, purpose: "2fa" },
        challengeSecret,
        { expiresIn: "5m", algorithm: "HS256" },
      );

      result = {
        requiresTwoFactor: true,
        challengeToken,
      };
    } else {

      result = {
        requiresTwoFactor: false,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
        },
      };
    }

    const ticket = createOAuthTicket(result);
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not configured");
    }

    res.redirect(
      `${frontendUrl}/login?oauth_ticket=${encodeURIComponent(ticket)}`,
    );
  } catch (err: any) {
    console.error("Erreur OAuth 42:", err.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};
