import { WebSocket } from 'ws';
import { ChatEvents, ChatServerMessage } from '../../../shared/types/chat-types';
import { prisma } from '../prisma';


// userId -> that user's live sockets.
export const onlineUsers = new Map<string, Set<WebSocket>>();


// Send one packet to every open socket of a user (all their tabs).
export function sendTo(userId: number | string, packet: ChatServerMessage) {
  const data = JSON.stringify(packet);

  for (const socket of onlineUsers.get(String(userId)) ?? [])
    if (socket.readyState === WebSocket.OPEN) socket.send(data);
}



export async function getFriendIds(userId: string): Promise<number[]> {
  const id = Number(userId);

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userLowId: id }, { userHighId: id }] },
    select: { userLowId: true, userHighId: true }, // only the two columns we need
  });
  return friendships.map((f) => (f.userLowId === id ? f.userHighId : f.userLowId));
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


// True if EITHER user blocked the other
export async function isBlocked(a: number, b: number): Promise<boolean> {
  const row = await prisma.blockedUser.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
  });
  return !!row;
}

// True if the two users are friends
export async function areFriends(a: number, b: number): Promise<boolean> {
  const row = await prisma.friendship.findUnique({
    where: { userLowId_userHighId: { userLowId: Math.min(a, b), userHighId: Math.max(a, b) } },
  });
  return !!row;
}

// Partners who haven't blocked us (and we haven't blocked): the only ones who may see our status.
export async function unblockedFriends(userId: string, partners: number[]) {
  const blocked = await Promise.all(partners.map((p) => isBlocked(p, Number(userId))));
  return partners.filter((_, i) => !blocked[i]);
}