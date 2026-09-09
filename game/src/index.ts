import express from 'express';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'game' });
});

app.get('/whoami', (req, res) => {
  const userId = req.headers['x-user-id']

  return res.status(200).json({
    userId,
  })
})

app.listen(PORT, () => {
  console.log(`[GAME] Service running on port ${PORT}`);
});