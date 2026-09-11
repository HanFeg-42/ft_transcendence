import express from 'express';
import http from 'http';
import { setupWebSocket } from './wsTypes';

const app = express(); //application / request handling logic
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'game' });
});


//added for ws
const server = http.createServer(app); // creates a server
setupWebSocket(server);


server.listen(PORT, () => {
  console.log(`[GAME] Service running on port ${PORT}`);
});