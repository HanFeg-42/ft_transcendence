import http from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { ChatEvents, ChatMessageIncoming, ChatClientMessage } from "../../../shared/types/chat-types";
import { prisma } from "../prisma";
import {
  onlineUsers,
  sendTo,
  getMessagePartners,
  sendPresence,
  broadcastPresenceToPartners,
} from "./presence";
import { notifyUser } from "../notifications/notifyUser";
import { NotificationTypes } from "../../../shared/types/notification-types";



const AUTH_URL = process.env.AUTH_SERVICE_URL || "http://auth:3001";
const INVITE_TTL_MS = 60_000; // an invite expires after 60s
const hits = new WeakMap<WebSocket, number[]>(); // recent send times per socket
const known = new Set<number>(); // user ids already confirmed to exist

// DB message -> the shape the frontend expects (also used by routes/messages.ts)
export const toIncoming = (m: {
  id: number; senderId: number; receiverId: number; content: string;
  createdAt: Date; readAt: Date | null; kind: string; meta: unknown;
}): ChatMessageIncoming => ({
  id: m.id,
  sender_id: m.senderId,
  receiver_id: m.receiverId,
  content: m.content,
  created_at: m.createdAt.toISOString(),
  read_at: m.readAt ? m.readAt.toISOString() : null,
  kind: m.kind as ChatMessageIncoming["kind"],
  meta: m.meta as ChatMessageIncoming["meta"],
});

function sendError(ws: WebSocket, message: string) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event: ChatEvents.ERROR, data: { message } }));
}

async function validate(ws: WebSocket, p: any, myId: string): Promise<string | null> {
  if (!p || typeof p.data !== "object" || !p.data) return "Malformed packet";
  const d = p.data;
  const e = p.event;

  // rate limit: 20 messages/invites per 10s per socket
  if (e === ChatEvents.MESSAGE || e === ChatEvents.GAME_INVITE) {
    const now = Date.now();
    const recent = (hits.get(ws) ?? []).filter((t) => now - t < 10_000);
    recent.push(now);
    hits.set(ws, recent);
    if (recent.length > 20) return "Too many messages, slow down";
  }

  // content: trimmed, non-empty, max 1000 (saved trimmed)
  if (e === ChatEvents.MESSAGE) {
    if (typeof d.content !== "string" || !d.content.trim()) return "Message cannot be empty";
    d.content = d.content.trim();
    if (d.content.length > 1000) return "Message too long (max 1000 characters)";
  }

  // target user: integer, not me, exists
  if ([ChatEvents.MESSAGE, ChatEvents.TYPING, ChatEvents.GAME_INVITE, ChatEvents.READ].includes(e)) {
    const id = e === ChatEvents.READ ? d.sender_id : d.receiver_id;
    if (!Number.isSafeInteger(id) || id <= 0 || id === Number(myId)) return "Invalid user id";
    if (!known.has(id)) {
      const r = await fetch(`${AUTH_URL}/users/${id}`).catch(() => null);
      if (!r?.ok) return r?.status === 404 ? "User not found" : "Could not verify user, try again";
      known.add(id);
    }
  }
  return null;
}

// true if EITHER user blocked the other
async function isBlocked(a: number, b: number): Promise<boolean> {
  const row = await prisma.blockedUser.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
  });
  return !!row;
}

// Partners who haven't blocked us (and we haven't blocked): the only ones who may see our status.
async function visiblePartners(userId: string, partners: number[]) {
  const blocked = await Promise.all(partners.map((p) => isBlocked(p, Number(userId))));
  return partners.filter((_, i) => !blocked[i]);
}

// Close a pending invite (accepted / declined / expired) and tell both users.
// `byUser` is set when someone answers, so only the invited user can do it.
async function settleInvite(id: number, status: "accepted" | "declined" | "expired", byUser?: number) {
  const invite = await prisma.message.findUnique({ where: { id } });
  const meta = invite?.meta as { gameId?: string; status?: string } | null;
  if (!invite || invite.kind !== "game_invite" || meta?.status !== "pending") return; // already settled
  if (byUser !== undefined && invite.receiverId !== byUser) return;

  // a late answer counts as expired
  const final = status !== "expired" && Date.now() - invite.createdAt.getTime() > INVITE_TTL_MS ? "expired" : status;

  const updated = await prisma.message.update({ where: { id }, data: { meta: { ...meta, status: final } } });
  const packet = { event: ChatEvents.GAME_INVITE_REPLY, data: toIncoming(updated) } as const;
  sendTo(invite.senderId, packet);
  sendTo(invite.receiverId, packet);
}

async function handleConnection(ws: WebSocket, req: http.IncomingMessage) {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) return ws.close(1008, "Missing identity");

  const wasOffline = !onlineUsers.has(userId);
  const sockets = onlineUsers.get(userId) ?? new Set<WebSocket>();
  sockets.add(ws);
  onlineUsers.set(userId, sockets);

  ws.on("message", (rawData: RawData) =>
    handleMessage(ws, rawData, userId).catch(() => sendError(ws, "Something went wrong")),
  );
  ws.on("close", () => handleClose(ws, userId));
  ws.on("error", () => {}); // required: an unhandled socket "error" would crash the process

  const partners = await getMessagePartners(userId);
  const visible = await visiblePartners(userId, partners);

  // Snapshot: tell THIS new client who among their partners is online (blocked ones look offline)
  for (const partnerId of partners) {
    const online = onlineUsers.has(String(partnerId)) && visible.includes(partnerId);
    sendPresence(ws, partnerId, online ? "online" : "offline");
  }
  // Only the FIRST socket is a real "came online" transition (a second tab isn't).
  if (wasOffline) broadcastPresenceToPartners(visible, Number(userId), "online");
}

async function handleMessage(ws: WebSocket, rawData: RawData, userId: string) {
  let packet: ChatClientMessage;
  try {
    packet = JSON.parse(rawData.toString());
  } catch {
    return sendError(ws, "Invalid JSON");
  }

  const error = await validate(ws, packet, userId);
  if (error) return sendError(ws, error);

  const me = Number(userId);

  switch (packet.event) {
    case ChatEvents.MESSAGE: {
      const { receiver_id, content } = packet.data;
      if (await isBlocked(receiver_id, me)) return sendError(ws, "You can't message this user");

      const saved = await prisma.message.create({ data: { senderId: me, receiverId: receiver_id, content } });

      try {
        await notifyUser(receiver_id, NotificationTypes.MESSAGE, {
          messageId: saved.id,
          senderId: me,
        });
      } catch {
        // a failed notification must not block the message
      }

      // To the receiver's tabs AND the sender's tabs (the sender's UI waits for this echo).
      const message = { event: ChatEvents.MESSAGE, data: toIncoming(saved) } as const;
      sendTo(receiver_id, message);
      sendTo(me, message);
      break;
    }

    case ChatEvents.READ: {
      // "I read the messages from sender_id"
      const friendId = packet.data.sender_id;
      if (await isBlocked(friendId, me)) break;

      const now = new Date();
      await prisma.message.updateMany({
        where: { senderId: friendId, receiverId: me, readAt: null },
        data: { readAt: now },
      });
      // tell the friend so their ✓✓ turns live
      sendTo(friendId, { event: ChatEvents.READ, data: { reader_id: me, read_at: now.toISOString() } });
      break;
    }

    case ChatEvents.TYPING: {
      const { receiver_id } = packet.data;
      if (await isBlocked(receiver_id, me)) break;
      sendTo(receiver_id, { event: ChatEvents.TYPING, data: { sender_id: me } });
      break;
    }

    case ChatEvents.GAME_INVITE: {
      const { receiver_id } = packet.data;
      if ((await isBlocked(receiver_id, me)) || !onlineUsers.has(String(receiver_id)))
        return sendError(ws, "User is not available to play");

      const saved = await prisma.message.create({
        data: {
          senderId: me,
          receiverId: receiver_id,
          content: "Game invite",
          kind: "game_invite",
          meta: { gameId: crypto.randomUUID(), status: "pending" },
        },
      });
      setTimeout(() => settleInvite(saved.id, "expired").catch(() => {}), INVITE_TTL_MS);

      // the sender needs the real id/gameId back too
      const invite = { event: ChatEvents.GAME_INVITE, data: toIncoming(saved) } as const;
      sendTo(receiver_id, invite);
      sendTo(me, invite);
      break;
    }

    case ChatEvents.GAME_INVITE_REPLY:
      await settleInvite(packet.data.message_id, packet.data.accept ? "accepted" : "declined", me);
      break;
  }
}

async function handleClose(ws: WebSocket, userId: string) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;

  sockets.delete(ws);
  // Only "offline" once their LAST socket closes.
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    const partners = await getMessagePartners(userId);
    broadcastPresenceToPartners(await visiblePartners(userId, partners), Number(userId), "offline");
  }
}

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });
  const alive = new WeakSet<WebSocket>();

  wss.on("connection", (ws, req) => {
    alive.add(ws);
    ws.on("pong", () => alive.add(ws)); // browsers answer pings automatically
    handleConnection(ws, req);
  });

  // heartbeat: drop sockets that stopped answering pings
  setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.has(ws)) { ws.terminate(); continue; }
      alive.delete(ws);
      ws.ping();
    }
  }, 15000);

  // restart cleanup: timers are lost, so close every invite still pending
  prisma.message
    .findMany({ where: { kind: "game_invite", meta: { path: ["status"], equals: "pending" } } })
    .then((rows) => Promise.all(rows.map((m) => settleInvite(m.id, "expired"))))
    .catch(() => {});
}