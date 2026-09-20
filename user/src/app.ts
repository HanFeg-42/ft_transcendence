import express from 'express';
import cors from 'cors';
import profileRoutes from './routes/profile.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Charger les routes
app.use('/profile', profileRoutes);

export default app;