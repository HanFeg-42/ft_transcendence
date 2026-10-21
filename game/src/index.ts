import express from "express";
import http from "http";
import { setupWebSocket } from './websocket';
import matchRoutes from "./routes/match.routes";
import statsRoutes from "./routes/stats.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";

const app = express(); //application / request handling logic
app.set("json replacer", (key: string, value: unknown) => {
  return typeof value === "bigint" ? String(value) : value;
} );
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

app.use("/matches", matchRoutes);
app.use("/stats", statsRoutes);
app.use("/leaderboard", leaderboardRoutes);

//added for ws
const server = http.createServer(app); // creates a server
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`[GAME-SERVICE] Listening on port ${PORT}`);
});

