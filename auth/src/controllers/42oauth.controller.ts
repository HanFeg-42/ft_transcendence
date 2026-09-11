import { Request, Response } from 'express';

// 1. On crée une interface TypeScript pour typer proprement les données que 42 nous renverra plus tard
interface FortyTwoUser {
  id: number;
  login: string;
  email: string;
  image?: {
    link?: string;
  };
}

/**
 * 2. Première fonction : Rediriger l'utilisateur vers 42
 * Cette fonction est appelée dès que l'utilisateur clique sur "Continue with 42"
 */
export const redirectTo42 = (req: Request, res: Response): void => {
  // On construit l'URL officielle de 42 avec nos paramètres
  const fortyTwoAuthUrl = `https://api.intra.42.fr/oauth/authorize?` +
    `client_id=${process.env.FORTYTWO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.FORTYTWO_CALLBACK_URL || '')}` +
    `&response_type=code`;

    // On ordonne au navigateur du client de naviguer vers cette URL 42
  res.redirect(fortyTwoAuthUrl);
};