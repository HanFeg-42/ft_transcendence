import { WebSocket } from 'ws';
import { ChatEvents, ChatServerMessage, ChatPresenceEvent } from '../../../shared/types/chat-types';
import { prisma } from '../prisma';



// 1. Global Online Tracker (onlineUsers)
// userId -> that user's live sockets. A Set, not a single socket, so a
// second tab doesn't overwrite/kick out the first one.
export const onlineUsers = new Map<string, Set<WebSocket>>();



// 2. Finding Message Partners (getMessagePartners)
export async function getMessagePartners(userId: string): Promise<number[]> {
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



// 3. Sending Presence to a Single Socket (sendPresence)
export function sendPresence(ws: WebSocket, userId: number, status: 'online' | 'offline') {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    const data: ChatPresenceEvent = { user_id: userId, status };
    const packet: ChatServerMessage = { event: ChatEvents.PRESENCE, data };
    ws.send(JSON.stringify(packet));
  } catch (err) {
    console.warn('[CHAT-SERVICE] Failed to send presence to a socket, dropping it:', err);
  }
}



// 4. Broadcasting Presence to All Partners (broadcastPresenceToPartners)
export function broadcastPresenceToPartners(partnerIds: number[], userId: number, status: 'online' | 'offline') {
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