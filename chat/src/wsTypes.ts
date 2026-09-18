import http from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';

// Import shared WebSocket contract rules (event names and payload shapes)
import { ChatEvents, ChatMessageOutgoing, ChatMessageIncoming } from '../../shared/types/chat-types';

// Handle a new connection
function handleConnection(ws: WebSocket, req: http.IncomingMessage) {
  const userId = req.headers['x-user-id'] as string | undefined;

  if (!userId) {
    console.warn('[CHAT-SERVICE] Connection missing x-user-id, rejecting');
    ws.close(1008, 'Missing identity');
    return;
  }

  console.log('[CHAT-SERVICE] Client connected:', userId);

  // Listen for incoming data packets from the client
  ws.on('message', (rawData: RawData) => {
    handleMessage(ws, rawData, userId);
  });

  // Listen for client disconnects (tab closed, lost connection)
  ws.on('close', (code) => {
    handleClose(ws, code, userId);
  });

  // Listen for low-level socket errors
  ws.on('error', (err) => {
    handleError(ws, err);
  });
}

// Handle messages from the frontend
// Handle messages from the frontend
function handleMessage(ws: WebSocket, rawData: RawData, userId: string) {
  const rawText = rawData.toString();

  let packet;
  try {
    packet = JSON.parse(rawText);
  } catch (err) {
    console.warn('[CHAT-SERVICE] Invalid JSON received, ignoring:', rawText);
    return; // drop the bad message, keep the connection and service alive
  }

  // --- Placeholder: chat message logic goes here ---
  // (persist message, find receiver's socket, send it to them)
  if (packet.event === ChatEvents.MESSAGE) {
    const outgoing: ChatMessageOutgoing = packet.data;
    console.log(`[CHAT-SERVICE] Message from ${userId}:`, outgoing);

    // TEMP: echo straight back to the sender, just to prove the pipe works.
    // TODO: replace with real logic — save to DB, look up the RECEIVER's
    // actual socket (not the sender), and send it to them instead.
    const reply: ChatMessageIncoming = {
      id: 0,
      sender_id: Number(userId),
      receiver_id: outgoing.receiver_id,
      content: outgoing.content,
      created_at: new Date().toISOString(),
    };

    ws.send(
      JSON.stringify({
        event: ChatEvents.MESSAGE,
        data: reply,
      })
    );
  }
}

// Handle disconnection
function handleClose(ws: WebSocket, code: number, userId: string) {
  console.log(`[CHAT-SERVICE] Client disconnected: ${userId} (Code: ${code})`);

  // TODO: any cleanup (e.g. remove from an online-users registry)
}

// Handle socket errors
function handleError(ws: WebSocket, err: Error) {
  console.error('[CHAT-SERVICE] Socket error:', err.message);
}

// Setup WebSocket server
export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    handleConnection(ws, req);
  });

  console.log('[CHAT-SERVICE] WebSocket server initialized');
}