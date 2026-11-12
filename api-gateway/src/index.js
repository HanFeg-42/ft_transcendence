import express from 'express';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './middleware/authenticateToken.js';

const app = express();
const PORT = process.env.PORT || 3000;

// fail fast if the secret is missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

app.set('trust proxy', 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'api-gateway' });
});

// proxy calls handlers as (err, req, res); for ws upgrades `res` is a raw socket
const onProxyError = (serviceName) => (_err, _req, res) => {
  if (typeof res.status !== 'function') {
    res.destroy?.();
    return;
  }

  if (!res.headersSent) {
    res.status(502).json({ error: `${serviceName} service unreachable` });
  }
};

// REST proxies
app.use(
  '/auth',
  authLimiter,
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth:3001',
    changeOrigin: true,
    on: { error: onProxyError('Auth') }
  })
);

app.use(
  '/directory',
  authenticateToken,
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth:3001',
    changeOrigin: true,
    pathRewrite: (path) => `/users${path}`,
    on: { error: onProxyError('Auth') }
  })
);

app.use(
  '/users',
  authenticateToken,
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://user:3004',
    changeOrigin: true,
    on: { error: onProxyError('User') }
  })
);

app.use(
  '/game',
  authenticateToken,
  createProxyMiddleware({
    target: process.env.GAME_SERVICE_URL || 'http://game:3002',
    changeOrigin: true,
    on: { error: onProxyError('Game') }
  })
);

// internal chat routes are never exposed
app.use('/chat/internal', (_req, res) => res.status(404).end());

app.use(
  '/chat',
  authenticateToken,
  createProxyMiddleware({
    target: process.env.CHAT_SERVICE_URL || 'http://chat:3003',
    changeOrigin: true,
    on: { error: onProxyError('Chat') }
  })
);

// ws-only proxies, used through .upgrade() below
const gameWsProxy = createProxyMiddleware({
  target: process.env.GAME_SERVICE_URL || 'http://game:3002',
  changeOrigin: true,
  ws: true,
  on: { error: onProxyError('Game') }
});

const chatWsProxy = createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || 'http://chat:3003',
  changeOrigin: true,
  ws: true,
  on: { error: onProxyError('Chat') }
});

// REST 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found on API Gateway' });
});

// reads ?token=... from the upgrade request url
function extractToken(req) {
  const url = new URL(req.url, 'http://localhost');
  return url.searchParams.get('token') || null;
}

function rejectUpgrade(socket, status) {
  socket.write(`HTTP/1.1 ${status}\r\n\r\n`);
  socket.destroy();
}

const server = http.createServer(app);

// auth gate for every WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  // a client dropping mid-handshake must not crash the process
  socket.on('error', () => socket.destroy());

  const token = extractToken(req);

  if (!token) {
    rejectUpgrade(socket, '401 Unauthorized');
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    if (typeof decoded === 'string' || typeof decoded.userId !== 'number') {
      rejectUpgrade(socket, '401 Unauthorized');
      return;
    }

    req.headers['x-user-id'] = String(decoded.userId);
  } catch {
    rejectUpgrade(socket, '401 Unauthorized');
    return;
  }

  if (req.url.startsWith('/game/ws')) {
    gameWsProxy.upgrade(req, socket, head);
  } else if (req.url.startsWith('/chat/ws')) {
    chatWsProxy.upgrade(req, socket, head);
  } else {
    rejectUpgrade(socket, '404 Not Found');
  }
});

server.listen(PORT);