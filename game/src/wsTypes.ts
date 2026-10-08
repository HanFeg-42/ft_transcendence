import http from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
// Import shared WebSocket contract rules (event names and payload shapes)
import {
  GameEvents,
  PlayerInputPayload,
  GameState,
  JoinGamePayload,
} from "../../shared/types/game-types";
import { endSession, getSession, joinSession } from "./gameSessions";
import { applyInput, tick, removePlayer, finishMatch } from "./engine/engine";
import { saveMatch } from "./matchHistory";
import { reportResult } from "./reportResult";

// --- Room registry ---------------------------------------------------
// Tracks which sockets belong to which match. Lives at module scope so
// it persists across all connections, not reset per-client.
const gameRooms = new Map<string, Set<WebSocket>>();
const playerSocket = new Map<string, Websocket>();
const activeLoops = new Map<string, NodeJS.Timeout>();
const pendingStarts = new Map<string, NodeJS.Timeout>();
const START_DELAY_MS = 3000;
const abandonTimers = new Map<string, NodeJS.Timeout>();
const ABANDON_DELAY_MS = 30000;
const forfeitTimers = new Map<string, NodeJS.Timeout>();
const FORFEIT_DELAY_MS = 15000;
// Send a message to every socket currently in a given room
// Send a message to every socket currently in a given room
function broadcast(gameId: string, eventName: string, data: unknown) {
  const sockets = gameRooms.get(gameId);
  if (!sockets) return;

  // Wrap the payload in the standard envelope structure
  const message = JSON.stringify({
    event: eventName,
    data: data,
  });

  for (const client of sockets) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Handle a new connection
function handleConnection(ws: WebSocket, req: http.IncomingMessage) {
  const userId = req.headers["x-user-id"] as string | undefined;

  if (!userId) {
    console.warn("[GAME-SERVICE] Connection missing x-user-id, rejecting");
    ws.close(1008, "Missing identity");
    return;
  }

  console.log("[GAME-SERVICE] Client connected:", userId);

  // Listen for incoming data packets from the client
  ws.on("message", (rawData: RawData) => {
    try {
      handleMessage(ws, rawData, userId);
    } catch (e) {
      console.error("[GAME-SERVICE] Message handler failed:", e);
    }
  });

  // Listen for client disconnects (tab closed, lost connection)
  ws.on("close", (code) => {
    handleClose(ws, code, userId);
  });

  // Listen for low-level socket errors
  ws.on("error", (err) => {
    handleError(ws, err);
  });
}

// Handle messages from the frontend
function handleMessage(ws: WebSocket, rawData: RawData, userId: string) {
  console.log(`[GAME-SERVICE] Player ${userId} sent message`);
  // Convert incoming binary buffer into a plain text string
  const rawText = rawData.toString();

  // Parse text string into a usable JavaScript object
  let packet;
  try {
    packet = JSON.parse(rawText);
  } catch (err) {
    console.warn("[GAME-SERVICE] Invalid JSON received, ignoring:", rawText);
    return; // drop the bad message, keep the connection and service alive
  }

  if (!packet || typeof packet !== "object") return;
  if (!packet.data || typeof packet.data !== "object") return;

  // --- Join a room ---
  if (packet.event === GameEvents.JOIN_GAME) {
    const { gameId, mazeId }: JoinGamePayload = packet.data;
    if (!gameId || typeof gameId !== "string") return;
    const existing = getSession(gameId);
    if (
      existing &&
      existing.players.length >= 2 &&
      !existing.players.some((p) => p.id === userId)
    ) {
      ws.close(1008, "Room full");
      return;
    }
    const rejoining = existing?.players.find((p) => p.id === userId);
    if (rejoining) {
      rejoining.connected = true;
      const forfeitId = forfeitTimers.get(gameId);
      if (forfeitId) {
        clearTimeout(forfeitId);
        forfeitTimers.delete(gameId);
      }
      if (existing?.players.some((p) => !p.connected)) {
        startForfeitTimer(gameId, existing);
      }
    }
    const abandonId = abandonTimers.get(gameId);
    if (abandonId) {
      clearTimeout(abandonId);
      abandonTimers.delete(gameId);
    }
    if (!gameRooms.has(gameId)) {
      gameRooms.set(gameId, new Set());
    }
    gameRooms.get(gameId)!.add(ws);
    const old = playerSocket.get(userId);
    if (old && old !== ws) {
      gameRooms.get(gameId)?.delete(old);
      old.close(4000, "Replaced by a new connection");
    }
    playerSocket.set(userId, ws);

    const state: GameState = joinSession(gameId, userId, mazeId);
    broadcast(gameId, GameEvents.GAME_STATE, state);

    if (state.players.length === 2) {
      if (activeLoops.has(gameId) || pendingStarts.has(gameId)) return;

      const startId = setTimeout(() => {
        pendingStarts.delete(gameId);
        state.status = "playing";
        const startedAt = new Date();

        const loopId = setInterval(() => {
          if (state.players.every((p) => p.connected)) tick(state);
          broadcast(gameId, GameEvents.GAME_STATE, state);
          if (state.status !== "playing") {
            saveMatch(state, startedAt);
            reportResult(state);
            activeLoops.delete(gameId);
            gameRooms.delete(gameId);
            endSession(gameId);
            clearInterval(loopId);
          }
        }, 1000 / 30);

        activeLoops.set(gameId, loopId);
      }, START_DELAY_MS);

      pendingStarts.set(gameId, startId);
    }

    console.log(`[GAME-SERVICE] Client ${userId} joined room ${gameId}`);
    // return;
  }

  // Check if incoming packet matches the player movement event
  if (packet.event === GameEvents.PLAYER_INPUT) {
    // Type-cast the payload to enforce shared interface rules
    const input: PlayerInputPayload = packet.data;
    if (
      !input.gameId ||
      typeof input.gameId !== "string" ||
      !["UP", "DOWN", "LEFT", "RIGHT"].includes(input.direction)
    )
      return;
    console.log("[GAME-SERVICE] Player input:", input);
    const state = getSession(input.gameId);
    if (!state) return;
    applyInput(state, userId, input.direction);

    // Calculate new position...
    // ...

    if (!gameRooms.has(input.gameId)) {
      console.warn(
        `[GAME-SERVICE] PLAYER_INPUT for unknown room ${input.gameId}, ignoring`,
      );
      return;
    }
  }
}

const startForfeitTimer = (gameId: string, state: GameState) => {
  if (forfeitTimers.has(gameId)) return;
  const forfeitId = setTimeout(() => {
    forfeitTimers.delete(gameId);
    finishMatch(state, state.players.find((p) => p.connected)?.id);
  }, FORFEIT_DELAY_MS);
  forfeitTimers.set(gameId, forfeitId);
};
// Handle disconnection
function handleClose(ws: WebSocket, code: number, userId: string) {
  console.log(`[GAME-SERVICE] Player left the game: ${userId} (Code: ${code})`);
  if (playerSocket.get(userId) === ws) playerSocket.delete(userId);
  // Cleanup active game session...
  for (const [gameId, sockets] of gameRooms) {
    if (!sockets.delete(ws)) continue;
    const state = getSession(gameId);
    if (state?.status === "waiting") {
      removePlayer(userId, state);
      broadcast(gameId, GameEvents.GAME_STATE, state);
      const startId = pendingStarts.get(gameId);
      if (startId) {
        clearTimeout(startId);
        pendingStarts.delete(gameId);
      }
      if (state.players.length === 0) endSession(gameId);
    }
    if (state?.status === "playing") {
      const player = state.players.find((p) => p.id === userId);
      if (player) player.connected = false;
      if (sockets.size > 0) {
        startForfeitTimer(gameId, state);
      }
    }
    if (sockets.size === 0) {
      if (state?.status !== "playing") gameRooms.delete(gameId);
      else {
        const forfeitId = forfeitTimers.get(gameId);
        if (gameId) {
          clearTimeout(forfeitId);
          forfeitTimers.delete(gameId);
        }
        const abandonId = setTimeout(() => {
          const loopId = activeLoops.get(gameId);
          if (loopId) clearInterval(loopId);
          activeLoops.delete(gameId);
          abandonTimers.delete(gameId);
          gameRooms.delete(gameId);
          endSession(gameId);
        }, ABANDON_DELAY_MS);

        abandonTimers.set(gameId, abandonId);
      }
    }
  }
}

// Handle socket errors
function handleError(ws: WebSocket, err: Error) {
  console.error("[GAME-SERVICE] Socket error:", err.message);
}

// Setup WebSocket server
export function setupWebSocket(server: http.Server) {
  // Attach WebSocket server directly to the existing HTTP server instance
  const wss = new WebSocketServer({ server });

  // Triggered every time a new client establishes a socket connection
  wss.on("connection", (ws, req) => {
    handleConnection(ws, req);
  });

  console.log("[GAME-SERVICE] WebSocket server initialized");
}
