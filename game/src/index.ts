import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
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

const server = http.createServer(app);

// Attach WebSocket Server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  console.log("[GAME-SERVICE] Client connected from:", req.url);

  const userId = req.headers["x-user-id"];

  console.log(`[GAME-SERVICE] User ${userId} connected`);
  
  ws.on("close", (code, reason) => {
    console.log(`[GAME-SERVICE] Client disconnected (Code: ${code})`);
  });

  ws.on("error", (err) => {
    console.error("[GAME-SERVICE] Socket error:", err.message);
  });
});

server.listen(PORT, () => {
  console.log(`[GAME-SERVICE] Listening on port ${PORT}`);
});
