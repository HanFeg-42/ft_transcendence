import express from 'express';
import cors from 'cors';
import profileRoutes from './routes/profile.routes';
import achievementRoutes from "./routes/achievement.routes";
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/profile', profileRoutes);
app.use("/achievements", achievementRoutes);


app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

export default app;
