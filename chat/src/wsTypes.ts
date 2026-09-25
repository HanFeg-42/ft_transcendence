import http from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { ChatEvents, ChatMessageIncoming, ChatClientMessage, ChatServerMessage, ChatPresenceEvent } from '../../shared/types/chat-types';
import { prisma } from './prisma';

// userId -> that user's live sockets. A Set, not a single socket, so a
// second tab doesn't overwrite/kick out the first one.
const onlineUsers = new Map<string, Set<WebSocket>>();

// Users this userId has an existing Message with, in either direction —
// stand-in for a real friends list, which doesn't exist yet.
async function getMessagePartners(userId: string): Promise<number[]> {
  const id = Number(userId);
  const rows = await prisma.message.findMany({
    where: { OR: [{ senderId: id }, { receiverId: id }] },
    select: { senderId: true, receiverId: true },
  });

  const partners = new Set<number>();
  for (const row of rows) {
    partners.add(row.senderId === id ? row.receiverId : row.senderId);
  }
  return [...partners];
}

function sendPresence(ws: WebSocket, userId: number, status: 'online' | 'offline') {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    const data: ChatPresenceEvent = { user_id: userId, status };
    const packet: ChatServerMessage = { event: ChatEvents.PRESENCE, data };
    ws.send(JSON.stringify(packet));
  } catch (err) {
    console.warn('[CHAT-SERVICE] Failed to send presence to a socket, dropping it:', err);
  }
}

function broadcastPresenceToPartners(partnerIds: number[], userId: number, status: 'online' | 'offline') {
  for (const partnerId of partnerIds) {
    const sockets = onlineUsers.get(String(partnerId));
    if (!sockets) continue;
    for (const socket of sockets) {
      if (socket.readyState !== WebSocket.OPEN) {
        sockets.delete(socket); // stale entry, never got cleaned by its own close event
        continue;
      }
      sendPresence(socket, userId, status);
    }
  }
}

// Handle a new connection
async function handleConnection(ws: WebSocket, req: http.IncomingMessage) {
  const userId = req.headers['x-user-id'] as string | undefined;

  if (!userId) {
    console.warn('[CHAT-SERVICE] Connection missing x-user-id, rejecting');
    ws.close(1008, 'Missing identity');
    return;
  }

  console.log('[CHAT-SERVICE] Client connected:', userId);

  const wasOffline = !onlineUsers.has(userId);
  const sockets = onlineUsers.get(userId) ?? new Set<WebSocket>();
  sockets.add(ws);
  onlineUsers.set(userId, sockets);

  const partners = await getMessagePartners(userId);

  // Snapshot: tell THIS newly connected client who among their message
  // partners is already online — they only started listening now, so they
  // missed any earlier "came online" broadcast.
  for (const partnerId of partners) {
  const status = onlineUsers.has(String(partnerId)) ? 'online' : 'offline';
  sendPresence(ws, partnerId, status);
  }

  // Only the FIRST socket for this user is a real "came online" transition —
  // a second tab opening shouldn't re-announce someone already online.
  if (wasOffline) {
    broadcastPresenceToPartners(partners, Number(userId), 'online');
  }

  ws.on('message', (rawData: RawData) => handleMessage(ws, rawData, userId));
  ws.on('close', (code) => handleClose(ws, code, userId));
  ws.on('error', (err) => handleError(ws, err));
}

// Handle messages from the frontend
async function handleMessage(ws: WebSocket, rawData: RawData, userId: string) {
  const rawText = rawData.toString();

  let packet: ChatClientMessage;
  try {
    packet = JSON.parse(rawText);
  } catch (err) {
    console.warn('[CHAT-SERVICE] Invalid JSON received, ignoring:', rawText);
    return;
  }

  switch (packet.event) {
    case ChatEvents.MESSAGE: {
      const outgoing = packet.data;
      console.log(`[CHAT-SERVICE] Message from ${userId}:`, outgoing);

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

      const reply: ChatMessageIncoming = {
        id: saved.id,
        sender_id: saved.senderId,
        receiver_id: saved.receiverId,
        content: saved.content,
        created_at: saved.createdAt.toISOString(),
      };

      const message: ChatServerMessage = { event: ChatEvents.MESSAGE, data: reply };
      const payload = JSON.stringify(message);

      // Deliver to every socket the RECEIVER has open (multi-tab).
      const receiverSockets = onlineUsers.get(String(outgoing.receiver_id));
      if (receiverSockets) {
        for (const socket of receiverSockets) {
          if (socket.readyState === WebSocket.OPEN) socket.send(payload);
        }
      } else {
        console.warn(`[CHAT-SERVICE] Receiver ${outgoing.receiver_id} not online, message not delivered live (still persisted)`);
      }

      // ADDED: echo to the SENDER'S other open tabs (not this socket — it
      // already appended its own copy optimistically) so multi-tab stays synced.
      const senderSockets = onlineUsers.get(userId);
      if (senderSockets) {
        for (const socket of senderSockets) {
          if (socket !== ws && socket.readyState === WebSocket.OPEN) socket.send(payload);
        }
      }
      break;
    }
  }
}

// Handle disconnection
async function handleClose(ws: WebSocket, code: number, userId: string) {
  console.log(`[CHAT-SERVICE] Client disconnected: ${userId} (Code: ${code})`);

  const sockets = onlineUsers.get(userId);
  if (!sockets) return;

  sockets.delete(ws);

  // Only drop to "offline" once their LAST socket closes.
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    const partners = await getMessagePartners(userId);
    broadcastPresenceToPartners(partners, Number(userId), 'offline');
  }
}

function handleError(ws: WebSocket, err: Error) {
  console.error('[CHAT-SERVICE] Socket error:', err.message);
}

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => { handleConnection(ws, req); });
  console.log('[CHAT-SERVICE] WebSocket server initialized');
}