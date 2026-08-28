import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'api-gateway' });
});

// Forward /auth/* -> auth:3001/*
app.use(
  '/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth:3001',
    changeOrigin: true,
    pathRewrite: { '^/auth': '' }, // Strips /auth before sending to auth service
  })
);

// Forward /game/* -> game:3002/*
app.use(
  '/game',
  createProxyMiddleware({
    target: process.env.GAME_SERVICE_URL || 'http://game:3002',
    changeOrigin: true,
    pathRewrite: { '^/game': '' }, // Strips /game before sending to game service
  })
);

app.listen(PORT, () => {
  console.log(`[API-GATEWAY] Running on internal port ${PORT}`);
});