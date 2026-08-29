import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth' });
});

app.listen(PORT, () => {
  console.log(`[AUTH] Service running on port ${PORT}`);
});