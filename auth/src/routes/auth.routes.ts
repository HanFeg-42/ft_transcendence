import express from 'express';
import { redirectTo42, handle42Callback } from '../controllers/42oauth.controller.js';

const router = express.Router();

// Route déclenchée quand l'utilisateur clique sur le bouton "Continue with 42"
router.get('/42/login', redirectTo42);

// Route de retour configurée dans l'Intra 42 (Redirect URI)
router.get('/42/callback', handle42Callback);

export default router;