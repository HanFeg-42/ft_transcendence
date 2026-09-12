import http from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';

// Import shared WebSocket contract rules (event names and payload shapes)
import { GameEvents, PlayerInputPayload } from '../../shared/types/game-types';

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

  // Check if incoming packet matches the player movement event
  if (packet.event === GameEvents.PLAYER_INPUT) {
    // Type-cast the payload to enforce shared interface rules
    const input: PlayerInputPayload = packet.data;
 
    console.log('[GAME-SERVICE] Player input:', input);

    // Calculate new position...
    // ...

    // Convert response object into text string and send back down the pipe
    ws.send(
      JSON.stringify({
        event: GameEvents.GAME_STATE,
        data: { players: [], pellets: [], tick: 0 }
      })
    );
  }
}

// Handle disconnection
function handleClose(ws: WebSocket, code: number) {
  console.log(`[GAME-SERVICE] Player left the game (Code: ${code})`);

  // Cleanup active game session...
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