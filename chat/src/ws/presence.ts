import { WebSocket } from 'ws';
import { ChatEvents, ChatServerMessage } from '../../../shared/types/chat-types';
import { prisma } from '../prisma';

// userId -> that user's live sockets (a Set so a second tab doesn't kick out the first one).
export const onlineUsers = new Map<string, Set<WebSocket>>();

// Send one packet to every open socket of a user (all their tabs).
export function sendTo(userId: number | string, packet: ChatServerMessage) {
  const data = JSON.stringify(packet);
  for (const socket of onlineUsers.get(String(userId)) ?? [])
    if (socket.readyState === WebSocket.OPEN) socket.send(data);
}

// Everyone this user talks to: people they exchanged messages with + their friends.
export async function getMessagePartners(userId: string): Promise<number[]> {
  const id = Number(userId);
  const [messages, friendships] = await Promise.all([
    prisma.message.findMany({
      where: { OR: [{ senderId: id }, { receiverId: id }] },
      select: { senderId: true, receiverId: true },
    }),
    prisma.friendship.findMany({ where: { OR: [{ userLowId: id }, { userHighId: id }] } }),
  ]);

  const partners = new Set<number>();
  for (const m of messages) partners.add(m.senderId === id ? m.receiverId : m.senderId);
  for (const f of friendships) partners.add(f.userLowId === id ? f.userHighId : f.userLowId);
  return [...partners];
}

// Tell ONE socket that userId is online/offline.
export function sendPresence(ws: WebSocket, userId: number, status: 'online' | 'offline') {
  if (ws.readyState !== WebSocket.OPEN) return;
  const packet: ChatServerMessage = { event: ChatEvents.PRESENCE, data: { user_id: userId, status } };
  ws.send(JSON.stringify(packet));
}

// Tell all partners that userId is online/offline.
export function broadcastPresenceToPartners(partnerIds: number[], userId: number, status: 'online' | 'offline') {
  for (const partnerId of partnerIds)
    sendTo(partnerId, { event: ChatEvents.PRESENCE, data: { user_id: userId, status } });
}