import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { randomBytes } from "node:crypto";
import { createSession } from "../sessionTokens";

// 1. On crée une interface TypeScript pour typer proprement les données que 42 nous renverra plus tard
interface FortyTwoUser {
  id: number;
  login: string;
  email: string;
  image?: {
    link?: string;
  };
}

// Tickets temporaires pour transmettre le résultat OAuth au frontend.
// Le JWT complet ne doit pas apparaître dans l'URL.
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

  // Nettoyer les tickets expirés.
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

// Le frontend échangera ce ticket contre le résultat de connexion.
export const exchangeOAuthTicket = (req: Request, res: Response): void => {
  res.setHeader("Cache-Control", "no-store");

  const ticket = req.body?.ticket;

  if (typeof ticket !== "string") {
    res.status(400).json({ error: "OAuth ticket is required" });
    return;
  }

  const entry = oauthTickets.get(ticket);

  // Chaque ticket ne peut être utilisé qu'une seule fois.
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

/**
 * 2. Première fonction : Rediriger l'utilisateur vers 42
 * Cette fonction est appelée dès que l'utilisateur clique sur "Continue with 42"
 */
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

  // On ordonne au navigateur du client de naviguer vers cette URL 42
  res.redirect(fortyTwoAuthUrl);
};

/**
 * 3. Deuxième fonction : Le Callback 42
 * Reçoit le code temporaire de 42 pour l'échanger contre un token d'accès
 */
export const handle42Callback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // A) On extrait 'code' et 'error' des paramètres d'URL (req.query)
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

  // Si l'utilisateur a cliqué sur "Refuser" sur la page 42 ou s'il n'y a pas de code
  if (error || typeof code !== "string" || !code) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_cancelled`);
    return;
  }

  try {
    // B) ÉCHANGE DU CODE CONTRE LE TOKEN 42
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

    // Si 42 nous renvoie une erreur au lieu du token
    if (!tokenResponse.ok) {
      throw new Error(
        tokenData.error_description || "Échec de la récupération du token 42",
      );
    }

    // On extrait le fameux token d'accès
    const fortyTwoAccessToken: string = tokenData.access_token;

    // C) RÉCUPÉRATION DES INFORMATIONS DU PROFIL 42
    // On fait une requête GET à l'API 42 en transmettant le token dans le Header Authorization
    const userResponse = await fetch("https://api.intra.42.fr/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${fortyTwoAccessToken}`,
      },
    });

    // On transforme la réponse JSON et on applique notre type FortyTwoUser
    const ftData: FortyTwoUser = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error(
        "Impossible de récupérer le profil utilisateur depuis 42",
      );
    }

    // D) GESTION DANS LA BASE DE DONNÉES AVEC PRISMA
    // On importe prisma (assurez-vous d'avoir importé Prisma en haut du fichier)
    // 1. On cherche si un utilisateur existe déjà soit par son ID 42, soit par son Email
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

      // Garder le login 42 si disponible, sinon ajouter un suffixe unique.
      const username = existingUsername
        ? `${ftData.login}_${randomBytes(8).toString("hex")}`
        : ftData.login;

      user = await prisma.user.create({
        data: {
          username,
          email: ftData.email,
          fortyTwoId: ftData.id,
          avatar: ftData.image?.link || "",
        },
      });
    }

    // E) GÉNÉRATION DU JWT & REDIRECTION
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

      // 42 a vérifié l'identité, mais la 2FA Pacova reste obligatoire.
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
      // Même format et durée que la connexion classique.
      // const token = jwt.sign({ userId: user.id }, jwtSecret, {
      //   expiresIn: "1h",
      //   algorithm: "HS256",
      // });

      result = {
        requiresTwoFactor: false,
        // token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
        },
      };
    }

    // Transmettre uniquement un ticket temporaire dans l'URL.
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
