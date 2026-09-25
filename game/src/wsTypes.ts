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
import { applyInput, tick, removePlayer } from "./engine/engine";

// --- Room registry ---------------------------------------------------
// Tracks which sockets belong to which match. Lives at module scope so
// it persists across all connections, not reset per-client.
const gameRooms = new Map<string, Set<WebSocket>>();
const activeLoops = new Map<string, NodeJS.Timeout>();
const pendingStarts = new Map<string, NodeJS.Timeout>();
const START_DELAY_MS = 3000;

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

  console.log("[GAME-SERVICE] Client connected:", userId, "from:", req.url);

  // Listen for incoming data packets from the client
  ws.on("message", (rawData: RawData) => {
    handleMessage(ws, rawData, userId);
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

  // --- Join a room ---
  if (packet.event === GameEvents.JOIN_GAME) {
    const { gameId }: JoinGamePayload = packet.data;
    const existing = getSession(gameId);
    if (
      existing &&
      existing.players.length >= 2 &&
      !existing.players.some((p) => p.id === userId)
    ) {
      ws.close(1008, "Room full");
      return;
    }
    if (!gameRooms.has(gameId)) {
      gameRooms.set(gameId, new Set());
    }
    gameRooms.get(gameId)!.add(ws);

    const state: GameState = joinSession(gameId, userId);
    broadcast(gameId, GameEvents.GAME_STATE, state);

    if (state.players.length === 2) {
      if (activeLoops.has(gameId) || pendingStarts.has(gameId)) return;

      const timeoutId = setTimeout(() => {
        pendingStarts.delete(gameId);
        state.status = "playing";

        const loopId = setInterval(() => {
          tick(state);
          broadcast(gameId, GameEvents.GAME_STATE, state);
          if (state.status !== "playing") {
            activeLoops.delete(gameId);
            gameRooms.delete(gameId);
            endSession(gameId);
            clearInterval(loopId);
          }
        }, 1000 / 30);

        activeLoops.set(gameId, loopId);
      }, START_DELAY_MS);

      pendingStarts.set(gameId, timeoutId);
    }

    console.log(`[GAME-SERVICE] Client ${userId} joined room ${gameId}`);
    // return;
  }

  // Check if incoming packet matches the player movement event
  if (packet.event === GameEvents.PLAYER_INPUT) {
    // Type-cast the payload to enforce shared interface rules
    const input: PlayerInputPayload = packet.data;
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

    //Game engine calculates new position, pellets eaten, tick count...
    // const updatedState: GameState = {
    //   players: [{ id: "p1", username: "playerAA", x: 10, y: 12, score: 100 }],
    //   pellets: [{ x: 5, y: 5 }],
    //   tick: 42,
    // };

    // broadcast(input.gameId, GameEvents.GAME_STATE, updatedState);

    // Convert response object into text string and send back down the pipe
    // ws.send(
    //   JSON.stringify({
    //     event: GameEvents.GAME_STATE,
    //     data: updatedState
    //   })
    // );
  }
}

// Handle disconnection
function handleClose(ws: WebSocket, code: number, userId: string) {
  console.log(`[GAME-SERVICE] Player left the game: ${userId} (Code: ${code})`);

  // Cleanup active game session...

  for (const [gameId, sockets] of gameRooms) {
    if (!sockets.delete(ws)) continue;
    const state = getSession(gameId);
    if (state?.status === "waiting") {
      removePlayer(userId, state);
      broadcast(gameId, GameEvents.GAME_STATE, state);
      const timeoutId = pendingStarts.get(gameId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        pendingStarts.delete(gameId);
      }
      if (state.players.length === 0) endSession(gameId);
    }
    if (sockets.size === 0) gameRooms.delete(gameId);
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
