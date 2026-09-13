import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma'

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


import { Request, Response } from 'express';

// ... (Garde l'interface et redirectTo42 ici)

/**
 * 3. Deuxième fonction : Le Callback 42
 * Reçoit le code temporaire de 42 pour l'échanger contre un token d'accès
 */
export const handle42Callback = async (req: Request, res: Response): Promise<void> => {
  // A) On extrait 'code' et 'error' des paramètres d'URL (req.query)
  const { code, error } = req.query;

  // Si l'utilisateur a cliqué sur "Refuser" sur la page 42 ou s'il n'y a pas de code
  if (error || !code) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_cancelled`);
    return;
  }





  try {
    // B) ÉCHANGE DU CODE CONTRE LE TOKEN 42
    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.FORTYTWO_CLIENT_ID,
        client_secret: process.env.FORTYTWO_CLIENT_SECRET,
        code: code as string, // "as string" informe TypeScript que code est du texte
        redirect_uri: process.env.FORTYTWO_CALLBACK_URL,
      }),
    });

    const tokenData = await tokenResponse.json();

    // Si 42 nous renvoie une erreur au lieu du token
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Échec de la récupération du token 42');
    }

    // On extrait le fameux token d'accès
    const fortyTwoAccessToken: string = tokenData.access_token;






    // C) RÉCUPÉRATION DES INFORMATIONS DU PROFIL 42
    // On fait une requête GET à l'API 42 en transmettant le token dans le Header Authorization
    const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${fortyTwoAccessToken}`,
      },
    });

    // On transforme la réponse JSON et on applique notre type FortyTwoUser
    const ftData: FortyTwoUser = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error('Impossible de récupérer le profil utilisateur depuis 42');
    }




    // D) GESTION DANS LA BASE DE DONNÉES AVEC PRISMA
    // On importe prisma (assurez-vous d'avoir importé Prisma en haut du fichier)
    // 1. On cherche si un utilisateur existe déjà soit par son ID 42, soit par son Email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { fortyTwoId: ftData.id },
          { email: ftData.email },
        ],
      },
    });

    if (!user) {
      // 2. Si l'utilisateur n'existe pas du tout : On le crée !
      user = await prisma.user.create({
        data: {
          username: ftData.login,
          email: ftData.email,
          fortyTwoId: ftData.id,
          avatar: ftData.image?.link || '',
        },
      });
    } else if (!user.fortyTwoId) {
      // 3. S'il existait déjà par e-mail mais n'avait pas d'ID 42 lié : On le met à jour
      user = await prisma.user.update({
        where: { id: user.id },
        data: { fortyTwoId: ftData.id },
      });
    }


// E) GÉNÉRATION DU JWT & REDIRECTION
    // On génère notre propre jeton pour le frontend
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    // On envoie le JWT dans un cookie sécurisé et on redirige l'utilisateur
    // const frontendUrl = process.env.FRONTEND_URL || 'https://localhost:443'
    res.cookie('jwt', token, { httpOnly: true, secure: false });
    res.redirect(`${process.env.FRONTEND_URL}/home`);
    
  } catch (err: any) {
    console.error('Erreur OAuth 42:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

