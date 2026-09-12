import http from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
// Import shared WebSocket contract rules (event names and payload shapes)
import { GameEvents, PlayerInputPayload, GameStatePayload, JoinGamePayload } from '../../shared/types/game-types';



// --- Room registry ---------------------------------------------------
// Tracks which sockets belong to which match. Lives at module scope so
// it persists across all connections, not reset per-client.
const gameRooms = new Map<string, Set<WebSocket>>();

// Send a message to every socket currently in a given room
function broadcast(gameId: string, data: unknown) {
  const sockets = gameRooms.get(gameId);
  if (!sockets) return;

  const message = JSON.stringify(data);
  for (const client of sockets) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}




// Handle a new connection
function handleConnection(ws: WebSocket, req: http.IncomingMessage) {
  console.log('[GAME-SERVICE] Client connected from:', req.url);

  // Listen for incoming data packets from the client
  ws.on('message', (rawData: RawData) => {
    handleMessage(ws, rawData);
  });

  // Listen for client disconnects (tab closed, lost connection)
  ws.on('close', (code) => {
    handleClose(ws, code);
  });

  // Listen for low-level socket errors
  ws.on('error', (err) => {
    handleError(ws, err);
  });
}


// Handle messages from the frontend
function handleMessage(ws: WebSocket, rawData: RawData) {
  console.log(`[GAME-SERVICE] Player sent message`);
  // Convert incoming binary buffer into a plain text string
  const rawText = rawData.toString();
  
  // Parse text string into a usable JavaScript object
  let packet;
  try {
    packet = JSON.parse(rawText);
  } catch (err) {
    console.warn('[GAME-SERVICE] Invalid JSON received, ignoring:', rawText);
    return; // drop the bad message, keep the connection and service alive
  }


  // --- Join a room ---
  if (packet.event === GameEvents.JOIN_GAME) {
    const { gameId }: JoinGamePayload = packet.data;

    if (!gameRooms.has(gameId)) {
      gameRooms.set(gameId, new Set());
    }
    gameRooms.get(gameId)!.add(ws);

    console.log(`[GAME-SERVICE] Client joined room ${gameId}`);
    return;
  }


  // Check if incoming packet matches the player movement event
  if (packet.event === GameEvents.PLAYER_INPUT) {
    // Type-cast the payload to enforce shared interface rules
    const input: PlayerInputPayload = packet.data;
    console.log('[GAME-SERVICE] Player input:', input);

    // Calculate new position...
    // ...

    if (!gameRooms.has(input.gameId)) {
      console.warn(`[GAME-SERVICE] PLAYER_INPUT for unknown room ${input.gameId}, ignoring`);
      return;
    }

    //Game engine calculates new position, pellets eaten, tick count...
    const updatedState: GameStatePayload = {
      players: [{ id: 'p1', username: 'playerAA', x: 10, y: 12, score: 100 }],
      pellets: [{ x: 5, y: 5 }],
      tick: 42
    };

    // Convert response object into text string and send back down the pipe
    // ws.send(
    //   JSON.stringify({
    //     event: GameEvents.GAME_STATE,
    //     data: updatedState
    //   })
    // );

    broadcast(input.gameId, updatedState);
  }
}

// Handle disconnection
function handleClose(ws: WebSocket, code: number) {
  console.log(`[GAME-SERVICE] Player left the game (Code: ${code})`);

  // Cleanup active game session...

    for (const [gameId, sockets] of gameRooms) {
    if (sockets.delete(ws) && sockets.size === 0) {
      gameRooms.delete(gameId);
    }
  }
}

// Handle socket errors
function handleError(ws: WebSocket, err: Error) {
  console.error('[GAME-SERVICE] Socket error:', err.message);
}

// Setup WebSocket server
export function setupWebSocket(server: http.Server) {
  // Attach WebSocket server directly to the existing HTTP server instance
  const wss = new WebSocketServer({ server });

  // Triggered every time a new client establishes a socket connection
  wss.on('connection', (ws, req) => {
    handleConnection(ws, req);
  });

  console.log('[GAME-SERVICE] WebSocket server initialized');
}