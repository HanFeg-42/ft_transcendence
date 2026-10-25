import express from 'express';
import cors from 'cors';
import profileRoutes from './routes/profile.routes';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

// Charger les routes
app.use('/profile', profileRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

export default app;

// express.static(dir) : middleware qui sert les fichiers du dossier dir.
// app.use('/uploads', ...) : monte ce middleware sur /uploads.
// Requête GET /uploads/avatars/xxx.jpg → renvoie le fichier.
// ⚠️ /uploads dans l'URL correspond au préfixe, pas au chemin complet. Le chemin complet est process.cwd()/uploads/avatars/xxx.jpg.
