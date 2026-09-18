import express from 'express';
import profileRoutes from './routes/profile.routes';
import { authentificateToken } from './middleware/auth.middleware'
import cors from 'cors'

const app = express();

app.use(cors());
app.use(express.json());

// Charger les routes de profil
app.use('/profile' ,authentificateToken , profileRoutes);


const PORT = 3004;
app.listen(PORT, () => {
    console.log('User Microservice running on port ${PORT}');
});