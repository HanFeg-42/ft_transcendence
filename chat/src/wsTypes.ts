import http from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
// Import shared WebSocket contract rules (event names and payload shapes)
import { ChatEvents, ChatMessageIncoming, ChatClientMessage, ChatServerMessage } from '../../shared/types/chat-types';
import { prisma } from './prisma';



// userId -> that user's live socket. This is the routing table: it's what
// lets handleMessage find the RECEIVER's connection instead of the sender's.
const onlineUsers = new Map<string, WebSocket>();

// Handle a new connection
function handleConnection(ws: WebSocket, req: http.IncomingMessage) {
  const userId = req.headers['x-user-id'] as string | undefined;

  if (!userId) {
    console.warn('[CHAT-SERVICE] Connection missing x-user-id, rejecting');
    ws.close(1008, 'Missing identity');
    return;
  }

  console.log('[CHAT-SERVICE] Client connected:', userId);
  onlineUsers.set(userId, ws);

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
async function handleMessage(ws: WebSocket, rawData: RawData, userId: string) {
  const rawText = rawData.toString();

  let packet: ChatClientMessage;
  try {
    packet = JSON.parse(rawText);
  } catch (err) {
    console.warn('[CHAT-SERVICE] Invalid JSON received, ignoring:', rawText);
    return; // drop the bad message, keep the connection and service alive
  }

  switch (packet.event) {
    case ChatEvents.MESSAGE: {
      const outgoing = packet.data; // narrowed to ChatMessageOutgoing, no cast needed
      console.log(`[CHAT-SERVICE] Message from ${userId}:`, outgoing);


      // Silently drop the message if the receiver has blocked the sender —
      // no persistence, no error back to the sender (standard chat UX: you
      // shouldn't be able to tell you've been blocked from message behavior alone).
      const isBlocked = await prisma.blockedUser.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: outgoing.receiver_id,
            blockedId: Number(userId),
          },
        },
      });

      if (isBlocked) {
        console.log(`[CHAT-SERVICE] Message from ${userId} to ${outgoing.receiver_id} dropped — blocked`);
        break;
      }


      const saved = await prisma.message.create({
      data: {
        senderId: Number(userId),
        receiverId: outgoing.receiver_id,
        content: outgoing.content,
      },
      });

      //persist to DB 
      const reply: ChatMessageIncoming = {
        id: saved.id,
        sender_id: saved.senderId,
        receiver_id: saved.receiverId,
        content: saved.content,
        created_at: saved.createdAt.toISOString(),
      };

      const message: ChatServerMessage = {
        event: ChatEvents.MESSAGE,
        data: reply,
      };

      // Look up the RECEIVER's socket in the routing table, not the sender's.
      const receiverSocket = onlineUsers.get(String(outgoing.receiver_id));

      if (!receiverSocket || receiverSocket.readyState !== WebSocket.OPEN) {
        console.warn(`[CHAT-SERVICE] Receiver ${outgoing.receiver_id} not online, message not delivered`);
        break; // no persistence yet, so an offline receiver just misses it for now
      }

      receiverSocket.send(JSON.stringify(message));
      break;
    }
  }
}

// Handle disconnection
function handleClose(ws: WebSocket, code: number, userId: string) {
  console.log(`[CHAT-SERVICE] Client disconnected: ${userId} (Code: ${code})`);

  // Only remove the entry if it still points at THIS socket — avoids a race
  // where a user reconnects (new socket registers) before the old socket's
  // close event fires and wipes out the new entry.
  if (onlineUsers.get(userId) === ws) {
    onlineUsers.delete(userId);
  }
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