import http from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { ChatEvents, ChatMessageIncoming, ChatClientMessage } from "../../../shared/types/chat-types";
import { prisma } from "../prisma";
import {
  onlineUsers,
  sendTo,
  getFriendIds,
  sendPresence,
  broadcastPresenceToPartners,
  unblockedFriends,
  areFriends,
  isBlocked,
} from "./presence";
import { notifyUser } from "../notifications/notifyUser";
import { NotificationTypes } from "../../../shared/types/notification-types";



/* --------------Config & in-memory state-------------- */                 
const AUTH_URL = process.env.AUTH_SERVICE_URL || "http://auth:3001";
const INVITE_TTL_MS = 60_000; // a game invite expires after 60s

const known = new Set<number>();                  // user ids we already checked
const recent = new WeakMap<WebSocket, number[]>(); // send times per socket

// Last time each socket sent a "typing" packet
const lastTyping = new WeakMap<WebSocket, number>();




/* --------------Helpers-------------- */
// DB message -> the shape the frontend expects
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


// Send an error packet to one socket (only if it is still open)
function sendError(ws: WebSocket, message: string) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event: ChatEvents.ERROR, data: { message } }));
}


// True if this socket sent more than 50 packets in the last 10 seconds
function tooMany(ws: WebSocket) {
  const now = Date.now();
  //Throws away any timestamps older than 10 seconds 
  const times = (recent.get(ws) ?? []).filter((t) => now - t < 10_000); 
  times.push(now);
  recent.set(ws, times);
  return times.length > 50;
}

// Returns an error message, or null if the packet is valid
async function validate(ws: WebSocket, p: any, myId: string): Promise<string | null> {
  if (tooMany(ws)) return "Too many requests, slow down";
  if (!p?.data || typeof p.data !== "object") return "Malformed packet";

  const { event, data } = p;

  if (event === ChatEvents.MESSAGE) {
    if (typeof data.content !== "string" || !data.content.trim()) return "Message cannot be empty";
    data.content = data.content.trim();
    if (data.content.length > 1000) return "Message too long (max 1000 characters)";
  }

  // Events aimed at another user: check the id, then check the user exists
  const aimed = [ChatEvents.MESSAGE, ChatEvents.TYPING, ChatEvents.GAME_INVITE, ChatEvents.READ];
  if (aimed.includes(event)) {
    const id = event === ChatEvents.READ ? data.sender_id : data.receiver_id;
    if (!Number.isSafeInteger(id) || id <= 0 || id === Number(myId)) return "Invalid user id";

    if (!known.has(id)) {
      const res = await fetch(`${AUTH_URL}/users/${id}`).catch(() => null);
      if (!res?.ok) return res?.status === 404 ? "User not found" : "Could not verify user, try again";
      known.add(id);
    }
  }

  return null;
}



// Close a pending invite and tell both users.
// `byUser` is set when someone answers, so only the invited user can do it.
async function settleInvite(id: number, status: "accepted" | "declined" | "expired", byUser?: number) {
  const invite = await prisma.message.findUnique({ where: { id } });
  if (!invite || invite.kind !== "game_invite") return;       // not an invite

  // byUser is only set when a real user answers; timers and cleanup leave it empty
  if (byUser !== undefined && invite.receiverId !== byUser) return;

  // answering after the time limit counts as expired
  const tooLate = Date.now() - invite.createdAt.getTime() > INVITE_TTL_MS;
  const final = tooLate ? "expired" : status;

  // ONE atomic step: change it only if it is still "pending".
  // If another reply got there first, count is 0 and we stop.
  const { count } = await prisma.message.updateMany({
    where: { id, meta: { path: ["status"], equals: "pending" } },
    data: { meta: { ...(invite.meta as object), status: final } },
  });
  if (count === 0) return;                                    // already settled

  const updated = await prisma.message.findUnique({ where: { id } });
  if (!updated) return;

  const packet = { event: ChatEvents.GAME_INVITE_REPLY, data: toIncoming(updated) } as const;
  sendTo(invite.senderId, packet);
  sendTo(invite.receiverId, packet);
}


/* --------------Connection lifecycle-------------- */      

// New socket: register it as online, attach listeners, and share presence.
async function handleConnection(ws: WebSocket, req: http.IncomingMessage) {
  // The gateway puts the authenticated user id in the x-user-id header
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) return ws.close(1008, "Missing identity");

  // Register this socket (a user can have several tabs open)
  const wasOffline = !onlineUsers.has(userId);
  const sockets = onlineUsers.get(userId) ?? new Set<WebSocket>();
  sockets.add(ws);
  onlineUsers.set(userId, sockets);

  ws.on("message", (rawData: RawData) =>
    handleMessage(ws, rawData, userId).catch(() => sendError(ws, "Something went wrong")),
  );
  ws.on("close", () => handleClose(ws, userId));
  ws.on("error", () => {}); // required: an unhandled socket "error" would crash the process

  const partners = await getFriendIds(userId);
  const unblocked = await unblockedFriends(userId, partners);

  // Snapshot: tell THIS new client who among their partners is online (blocked ones look offline)
  for (const partnerId of partners) {
    const online = onlineUsers.has(String(partnerId)) && unblocked.includes(partnerId);
    sendPresence(ws, partnerId, online ? "online" : "offline");
  }

  // Only the FIRST socket is a real "came online" transition
  if (wasOffline)
    broadcastPresenceToPartners(unblocked, Number(userId), "online");
}



// Routes each incoming packet to the right action, based on its event type.
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
    // Save the message, notify the receiver, and send it to both users
    case ChatEvents.MESSAGE: {
      const { receiver_id, content } = packet.data;

      if (await isBlocked(receiver_id, me)) return sendError(ws, "You can't message this user");
      if (!(await areFriends(receiver_id, me))) return sendError(ws, "You can only message friends");

      const saved = await prisma.message.create({ data: { senderId: me, receiverId: receiver_id, content } });

      try {
        await notifyUser(receiver_id, NotificationTypes.MESSAGE, {
          messageId: saved.id,
          senderId: me,
        });
      } catch {
        // a failed notification must not block the message
      }

      // To the receiver's tabs AND the sender's tabs (the sender's UI waits for this echo)
      const message = { event: ChatEvents.MESSAGE, data: toIncoming(saved) } as const;
      sendTo(receiver_id, message);
      sendTo(me, message);
      break;
    }


    // "I read the messages from sender_id": mark them as read and tell the sender
    case ChatEvents.READ: {
      const friendId = packet.data.sender_id;

      if (await isBlocked(friendId, me)) break;
      if (!(await areFriends(friendId, me))) break;

      const now = new Date();

      await prisma.message.updateMany({
        where: { senderId: friendId, receiverId: me, readAt: null },
        data: { readAt: now },
      });

      // Tell the friend so their ✓✓ turns live
      sendTo(friendId, { event: ChatEvents.READ, data: { reader_id: me, read_at: now.toISOString() } });
      break;
    }


    // Forward the "is typing..." signal (not saved in the DB)
    case ChatEvents.TYPING: {
      const { receiver_id } = packet.data;

      // Ignore typing packets sent less than 1s after the last one
      const last = lastTyping.get(ws) ?? 0;
      if (Date.now() - last < 1000) break;
      lastTyping.set(ws, Date.now());

      if (await isBlocked(receiver_id, me)) break;
      if (!(await areFriends(receiver_id, me))) break;

      sendTo(receiver_id, { event: ChatEvents.TYPING, data: { sender_id: me } });
      break;
    }


    // Create a pending game invite; it auto-expires after INVITE_TTL_MS
    case ChatEvents.GAME_INVITE: {
      const { receiver_id } = packet.data;

      if ((await isBlocked(receiver_id, me)) || !(await areFriends(receiver_id, me))
         || !onlineUsers.has(String(receiver_id)))
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

      // The sender needs the real id/gameId back too
      const invite = { event: ChatEvents.GAME_INVITE, data: toIncoming(saved) } as const;
      sendTo(receiver_id, invite);
      sendTo(me, invite);
      break;
    }


    // The invited user accepts or declines
    case ChatEvents.GAME_INVITE_REPLY: {
      await settleInvite(packet.data.message_id, packet.data.accept ? "accepted" : "declined", me);
      break;
    }
  }
}


// Socket closed: remove it, and announce "offline" only if it was the user's last one.
async function handleClose(ws: WebSocket, userId: string) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;

  sockets.delete(ws);

  // Only "offline" once their LAST socket closes
  if (sockets.size === 0) {
    onlineUsers.delete(userId);

    const partners = await getFriendIds(userId);
    broadcastPresenceToPartners(await unblockedFriends(userId, partners), Number(userId), "offline");
  }
}


/* --------------Setup-------------- */

// Attaches the WebSocket server to the HTTP server (same port)
export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });
  const alive = new WeakSet<WebSocket>();

  wss.on("connection", (ws, req) => {
    alive.add(ws);
    ws.on("pong", () => alive.add(ws)); // browsers answer pings automatically
    handleConnection(ws, req);
  });

  // Heartbeat: every 15s ping everyone, drop sockets that didn't answer the last ping
  setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.has(ws)) { ws.terminate(); continue; }

      alive.delete(ws);
      ws.ping();
    }
  }, 15000);

  // Restart cleanup: timers are lost on restart, so close every invite still pending
  prisma.message
    .findMany({ where: { kind: "game_invite", meta: { path: ["status"], equals: "pending" } } })
    .then((rows) => Promise.all(rows.map((m) => settleInvite(m.id, "expired"))))
    .catch(() => {});
}