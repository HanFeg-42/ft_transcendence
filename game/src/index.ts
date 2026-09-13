import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { setupWebSocket } from './wsTypes';

const app = express(); //application / request handling logic
const PORT = process.env.PORT || 3002;

// Standard HTTP routes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "game" });
});

app.get("/whoami", (req, res) => {
  const userId = req.headers["x-user-id"];

  return res.status(200).json({
    userId,
  });
});

//added for ws
const server = http.createServer(app); // creates a server
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`[GAME-SERVICE] Listening on port ${PORT}`);
});

