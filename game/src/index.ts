// import express from 'express';

// const app = express();
// const PORT = process.env.PORT || 3002;

// app.use(express.json());

// app.get('/health', (_req, res) => {
//   res.status(200).json({ status: 'ok', service: 'game' });
// });

// app.listen(PORT, () => {
//   console.log(`[GAME] Service running on port ${PORT}`);
// });



import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = process.env.PORT || 3002;

// Standard HTTP routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'game' });
});

const server = http.createServer(app);

// Attach WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('[GAME-SERVICE] Client connected from:', req.url);

  // Handle client disconnection
  ws.on('close', (code, reason) => {
    console.log(`[GAME-SERVICE] Client disconnected (Code: ${code})`);
  });

  // Handle socket errors cleanly
  ws.on('error', (err) => {
    console.error('[GAME-SERVICE] Socket error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`[GAME-SERVICE] Listening on port ${PORT}`);
});