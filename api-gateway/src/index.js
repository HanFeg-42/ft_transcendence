import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

// SECTION 1: TRUST PROXY (Required when running behind Nginx)
app.set('trust proxy', 1);

// SECTION 2: RATE LIMITER CONFIG
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 100, // Max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// SECTION 3: APPLY RATE LIMITER GLOBALLY
app.use(limiter);

// SECTION 4: HEALTH CHECK ENDPOINT
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'api-gateway' });
});

// SECTION 5: AUTH SERVICE PROXY (/auth/* -> auth:3001/*)
app.use(
  '/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth:3001',
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/auth': '' },
    onError: (err, req, res) => {
      console.error('[API-GATEWAY] Auth service error:', err.message);
      res.status(502).json({ error: 'Auth service unreachable' });
    }
  })
);

// SECTION 6: GAME SERVICE PROXY (/game/* -> game:3002/*)
app.use(
  '/game',
  createProxyMiddleware({
    target: process.env.GAME_SERVICE_URL || 'http://game:3002',
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/game': '' },
    onError: (err, req, res) => {
      console.error('[API-GATEWAY] Game service error:', err.message);
      res.status(502).json({ error: 'Game service unreachable' });
    }
  })
);

// SECTION 7: CATCH-ALL ROUTE (404 Fallback)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found on API Gateway' });
});

// SECTION 8: START SERVER
app.listen(PORT, () => {
  console.log(`[API-GATEWAY] Running on internal port ${PORT}`);
});