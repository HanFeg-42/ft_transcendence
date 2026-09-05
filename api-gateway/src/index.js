import express from 'express';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;

// fail fast if secret isn't set — no silent fallback
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

app.set('trust proxy', 1);

// rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'api-gateway' });
});

// REST proxies
app.use(
  '/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth:3001',
    changeOrigin: true, //Changes HTTP host header of outgoing request to match target URL host
    on: {
      error: (err, req, res) => {
        console.error('[API-GATEWAY] Auth service error:', err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Auth service unreachable' });
      }
    }
  })
);

app.use(
  '/game',
  createProxyMiddleware({
    target: process.env.GAME_SERVICE_URL || 'http://game:3002',
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error('[API-GATEWAY] Game service error:', err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Game service unreachable' });
      }
    }
  })
);

// ws-only proxy instances, only ever used via .upgrade() below
const gameWsProxy = createProxyMiddleware({
  target: process.env.GAME_SERVICE_URL || 'http://game:3002',
  changeOrigin: true,
  ws: true
});

const chatWsProxy = createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || 'http://chat:3003',
  changeOrigin: true,
  ws: true
});

// REST 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found on API Gateway' });
});

// pulls ?token=... off the upgrade request URL
function extractToken(req) {
  const url = new URL(req.url, 'http://localhost');
  return url.searchParams.get('token') || null;
}

const server = http.createServer(app);

// gatekeeper for every WebSocket upgrade attempt
server.on('upgrade', (req, socket, head) => {
  const token = extractToken(req);

  // no token -> reject immediately
  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  // invalid/expired token -> reject immediately
  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.warn('[API-GATEWAY] Rejected ws handshake:', err.message);
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  // token valid -> route by path prefix
  if (req.url.startsWith('/game/ws')) {
    gameWsProxy.upgrade(req, socket, head);
  } else if (req.url.startsWith('/chat/ws')) {
    chatWsProxy.upgrade(req, socket, head);
  } else {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`[API-GATEWAY] Running on internal port ${PORT}`);
});