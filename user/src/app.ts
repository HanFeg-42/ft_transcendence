import express from 'express';
import cors from 'cors';
import profileRoutes from './routes/profile.routes';
import { authenticateToken } from './middleware/auth.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// Charger les routes
app.use('/profile', authenticateToken, profileRoutes);

export default app;