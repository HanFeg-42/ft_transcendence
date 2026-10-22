import http from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { randomUUID } from "crypto";
// Import shared WebSocket contract rules (event names and payload shapes)
import {
  GameServerEvents,
  GameClientEvents,
  PlayerInputPayload,
  GameState,
  JoinGamePayload,
} from "../../shared/types/game-types";
import { endSession, getSession, joinSession } from "./gameSessions";
import { applyInput, tick, removePlayer, finishMatch } from "./engine/engine";
import saveMatch from "./services/saveMatchHistory";
import { reportResult } from "./services/reportResult";

// --- Room registry ---------------------------------------------------
// Tracks which sockets belong to which match. Lives at module scope so
// it persists across all connections, not reset per-client.
const gameRooms = new Map<string, Set<WebSocket>>();
const playerSocket = new Map<string, WebSocket>();
const activeLoops = new Map<string, NodeJS.Timeout>();
const pendingStarts = new Map<string, NodeJS.Timeout>();
const START_DELAY_MS = 3000;
const abandonTimers = new Map<string, NodeJS.Timeout>();
const ABANDON_DELAY_MS = 30000;
const forfeitTimers = new Map<string, NodeJS.Timeout>();
const FORFEIT_DELAY_MS = 15000;
let queuedPlayer: { userId: string; ws: WebSocket } | null = null;
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
    try {
      handleClose(ws, code, userId);
    } catch (e) {
      console.error("[GAME-SERVICE] Close handler failed:", e);
    }
  });

  // Listen for low-level socket errors
  ws.on("error", (err) => {
    handleError(ws, err);
  });
}

// Handle messages from the frontend
function handleMessage(ws: WebSocket, rawData: RawData, userId: string) {
  // Convert incoming binary buffer into a plain text string
  const rawText = rawData.toString();

  // Parse text string into a usable JavaScript object
  let packet;
  try {
    packet = JSON.parse(rawText);
  } catch (err) {
    console.warn("[GAME-SERVICE] Invalid JSON received, ignoring:", rawText);
    ws.send(
      JSON.stringify({
        event: GameServerEvents.ERROR,
        data: { message: "Invalid JSON" },
      }),
    );
    return; // drop the bad message, keep the connection and service alive
  }

  if (
    !packet ||
    typeof packet !== "object" ||
    !packet.data ||
    typeof packet.data !== "object"
  ) {
    ws.send(
      JSON.stringify({
        event: GameServerEvents.ERROR,
        data: { message: "Invalid message" },
      }),
    );
    return;
  }
  if (!Object.values(GameClientEvents).includes(packet.event)) {
    ws.send(
      JSON.stringify({
        event: GameServerEvents.ERROR,
        data: { message: "Unknown event" },
      }),
    );
    return;
  }
  if (packet.event === GameClientEvents.JOIN_GAME) {
    // --- Join a room ---
    const { gameId, mazeId }: JoinGamePayload = packet.data;
    if (!gameId || typeof gameId !== "string") {
      ws.send(
        JSON.stringify({
          event: GameServerEvents.ERROR,
          data: { message: "Invalid gameId" },
        }),
      );
      return;
    }
    for (const sockets of gameRooms.values()) {
      if (sockets.has(ws)) {
        ws.send(
          JSON.stringify({
            event: GameServerEvents.ERROR,
            data: { message: "This connection already joined a game" },
          }),
        );
        return;
      }
    }
    const existing = getSession(gameId);
    if (
      existing &&
      existing.players.length >= 2 &&
      !existing.players.some((p) => p.id === userId)
    ) {
      ws.send(
        JSON.stringify({
          event: GameServerEvents.ERROR,
          data: { message: "This room is full, try another one" },
        }),
      );
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
    broadcast(gameId, GameServerEvents.GAME_STATE, state);

    if (state.players.length === 2) {
      if (activeLoops.has(gameId) || pendingStarts.has(gameId)) return;

      const startId = setTimeout(() => {
        pendingStarts.delete(gameId);
        state.status = "playing";
        state.startedAt = Date.now();

        const loopId = setInterval(() => {
          try {
            if (state.players.every((p) => p.connected)) tick(state);
            broadcast(gameId, GameServerEvents.GAME_STATE, state);
            if (state.status !== "playing") {
              saveMatch(state);
              reportResult(state);
              activeLoops.delete(gameId);
              gameRooms.delete(gameId);
              endSession(gameId);
              clearInterval(loopId);
            }
          } catch (e) {
            console.error("[GAME-SERVICE] Game loop failed, ending match", e);
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
  if (packet.event === GameClientEvents.PLAYER_INPUT) {
    // Type-cast the payload to enforce shared interface rules
    const input: PlayerInputPayload = packet.data;
    if (!input.gameId || typeof input.gameId !== "string") {
      ws.send(
        JSON.stringify({
          event: GameServerEvents.ERROR,
          data: { message: "Invalid gameId" },
        }),
      );
      return;
    }
    if (!["UP", "DOWN", "LEFT", "RIGHT"].includes(input.direction)) {
      ws.send(
        JSON.stringify({
          event: GameServerEvents.ERROR,
          data: { message: "Invalid direction" },
        }),
      );
      return;
    }
    const state = getSession(input.gameId);
    if (!state) {
      ws.send(
        JSON.stringify({
          event: GameServerEvents.ERROR,
          data: { message: "Game not found" },
        }),
      );
      return;
    }
    applyInput(state, userId, input.direction);
  }

  if (packet.event === GameClientEvents.QUEUE) {
    if (!queuedPlayer) {
      queuedPlayer = { userId, ws };
      return;
    } else if (queuedPlayer.userId === userId) {
      ws.send(
        JSON.stringify({
          event: GameServerEvents.ERROR,
          data: { message: "You're already searching for a match" },
        }),
      );
      return;
    }
    const message = JSON.stringify({
      event: GameServerEvents.MATCH_FOUND,
      data: { gameId: randomUUID() },
    });
    ws.send(message);
    queuedPlayer.ws.send(message);
    queuedPlayer = null;
  }

  if (packet.event === GameClientEvents.LEAVE_QUEUE) {
    if (queuedPlayer?.ws === ws) queuedPlayer = null;
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
  if (queuedPlayer?.ws === ws) queuedPlayer = null;
  // Cleanup active game session...
  for (const [gameId, sockets] of gameRooms) {
    if (!sockets.delete(ws)) continue;
    const state = getSession(gameId);
    if (state?.status === "waiting") {
      removePlayer(userId, state);
      broadcast(gameId, GameServerEvents.GAME_STATE, state);
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
        if (forfeitId) {
          clearTimeout(forfeitId);
          forfeitTimers.delete(gameId);
        }
        const abandonId = setTimeout(() => {
          const loopId = activeLoops.get(gameId);
          if (loopId) clearInterval(loopId);
          activeLoops.delete(gameId);
          abandonTimers.delete(gameId);
          gameRooms.delete(gameId);
          state.status = "abandoned";
          saveMatch(state);
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
  const wss = new WebSocketServer({ server, maxPayload: 4 * 1024 });

  // Triggered every time a new client establishes a socket connection
  wss.on("connection", (ws, req) => {
    handleConnection(ws, req);
  });

  console.log("[GAME-SERVICE] WebSocket server initialized");
}
