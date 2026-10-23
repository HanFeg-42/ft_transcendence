import http from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import {
  ChatEvents,
  ChatMessageIncoming,
  ChatClientMessage,
  ChatServerMessage,
} from "../../../shared/types/chat-types";
import { prisma } from "../prisma";
import {
  onlineUsers,
  getMessagePartners,
  sendPresence,
  broadcastPresenceToPartners,
} from "./presence";
import { notifyUser } from "../notifications/notifyUser";
import { NotificationTypes } from "../../../shared/types/notification-types";





const AUTH_URL = process.env.AUTH_SERVICE_URL || "http://auth:3001";
const hits = new WeakMap<WebSocket, number[]>(); // recent send times per socket
const known = new Set<number>(); // user ids already confirmed to exist

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


async function isBlocked(a: number, b: number): Promise<boolean> {
  const row = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  return !!row;
}


const INVITE_TTL_MS = 60_000; // an invite expires after 60s

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
  const payload = JSON.stringify({
    event: ChatEvents.GAME_INVITE_REPLY,
    data: {
      id: updated.id,
      sender_id: updated.senderId,
      receiver_id: updated.receiverId,
      content: updated.content,
      created_at: updated.createdAt.toISOString(),
      read_at: null,
      kind: "game_invite",
      meta: updated.meta,
    } as ChatMessageIncoming,
  });
  for (const uid of [invite.senderId, invite.receiverId])
    for (const socket of onlineUsers.get(String(uid)) ?? [])
      if (socket.readyState === WebSocket.OPEN) socket.send(payload);
}



// 1. Handling New Connections (handleConnection)
async function handleConnection(ws: WebSocket, req: http.IncomingMessage) {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) {
    console.warn("[CHAT-SERVICE] Connection missing x-user-id, rejecting");
    ws.close(1008, "Missing identity");
    return;
  }

  // console.log("[CHAT-SERVICE] Client connected:", userId);

  const wasOffline = !onlineUsers.has(userId);
  const sockets = onlineUsers.get(userId) ?? new Set<WebSocket>();
  sockets.add(ws);
  onlineUsers.set(userId, sockets);

  ws.on("message", (rawData: RawData) => 
    handleMessage(ws, rawData, userId).catch(() => sendError(ws, "Something went wrong")),
  );


  ws.on("close", (code) => handleClose(ws, code, userId));
  ws.on("error", (err) => handleError(ws, err));

  const partners = await getMessagePartners(userId);

  // Snapshot: tell THIS newly connected client who among their message
  // partners is already online
  for (const partnerId of partners) {
    const status = onlineUsers.has(String(partnerId)) ? "online" : "offline";
    sendPresence(ws, partnerId, status);
  }
  // Only the FIRST socket for this user is a real "came online" transition —
  // a second tab opening shouldn't re-announce someone already online.
  if (wasOffline) {
    broadcastPresenceToPartners(partners, Number(userId), "online");
  }
}






// 2. Handling Incoming Messages (handleMessage)
async function handleMessage(ws: WebSocket, rawData: RawData, userId: string) {
  const rawText = rawData.toString();

  let packet: ChatClientMessage;
  try {
    packet = JSON.parse(rawText);
  } catch (err) {
    return sendError(ws, "Invalid JSON");
  }


  const error = await validate(ws, packet, userId);
  if (error) return sendError(ws, error);




  switch (packet.event) {
    case ChatEvents.MESSAGE: {
      const outgoing = packet.data;
      // console.log(`[CHAT-SERVICE] Message from ${userId}:`, outgoing);

      if (await isBlocked(outgoing.receiver_id, Number(userId))) break;   // MESSAGE

      const saved = await prisma.message.create({
        data: {
          senderId: Number(userId),
          receiverId: outgoing.receiver_id,
          content: outgoing.content,
        },
      });

      try {
        await notifyUser(outgoing.receiver_id, NotificationTypes.MESSAGE, {
          messageId: saved.id,
          senderId: Number(userId),
        });
      } catch (err) {
        console.error("[CHAT-SERVICE] Failed to create message notification:", err);
      }

      const reply: ChatMessageIncoming = {
        id: saved.id,
        sender_id: saved.senderId,
        receiver_id: saved.receiverId,
        content: saved.content,
        created_at: saved.createdAt.toISOString(),
        read_at: saved.readAt ? saved.readAt.toISOString() : null,
        kind: saved.kind as "text" | "game_invite",
        meta: saved.meta as ChatMessageIncoming["meta"],
      };

      const message: ChatServerMessage = {
        event: ChatEvents.MESSAGE,
        data: reply,
      };
      const payload = JSON.stringify(message);

      // Deliver to every socket the RECEIVER has open (multi-tab).
      const receiverSockets = onlineUsers.get(String(outgoing.receiver_id));
      if (receiverSockets) {
        for (const socket of receiverSockets) {
          if (socket.readyState === WebSocket.OPEN) socket.send(payload);
        }
      } else {
        console.warn(
          `[CHAT-SERVICE] Receiver ${outgoing.receiver_id} not online, message not delivered live (still persisted)`,
        );
      }

      // ADDED: echo to the SENDER'S other open tabs (not this socket — it
      // already appended its own copy optimistically) so multi-tab stays synced.
      const senderSockets = onlineUsers.get(userId);
      if (senderSockets) {
        for (const socket of senderSockets) {
          if (socket.readyState === WebSocket.OPEN)
            socket.send(payload);
        }
      }
      break;
    }

    case ChatEvents.READ: {
      const outgoing = packet.data; // { sender_id: number } — "I read messages from this sender"
      const friendId = outgoing.sender_id;
      const currentUserId = Number(userId);

      
      if (await isBlocked(friendId, currentUserId)) break;                // READ


      const now = new Date();

      // 2. Update all unread messages sent by friendId to currentUserId in the DB
      await prisma.message.updateMany({
        where: {
          senderId: friendId,
          receiverId: currentUserId,
          readAt: null,
        },
        data: {
          readAt: now,
        },
      });

      // 3. Construct payload to notify friendId that currentUserId read their messages
      const readEventMessage: ChatServerMessage = {
        event: ChatEvents.READ,
        data: {
          reader_id: currentUserId,
          read_at: now.toISOString(),
        },
      };
      const payload = JSON.stringify(readEventMessage);

      // 4. Forward event to friendId's active sockets so their UI turns green (✓✓) live
      const friendSockets = onlineUsers.get(String(friendId));
      if (friendSockets) {
        for (const socket of friendSockets) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(payload);
          }
        }
      }
      break;
    }

    case ChatEvents.TYPING: {
      const outgoing = packet.data; // { receiver_id: number }
      const receiverId = outgoing.receiver_id;
      const senderId = Number(userId);

     
      if (await isBlocked(receiverId, senderId)) break;                   // TYPING

      const typingEvent: ChatServerMessage = {
        event: ChatEvents.TYPING,
        data: { sender_id: senderId },
      };
      const payload = JSON.stringify(typingEvent);

      const receiverSockets = onlineUsers.get(String(receiverId));
      if (receiverSockets) {
        for (const socket of receiverSockets) {
          if (socket.readyState === WebSocket.OPEN) socket.send(payload);
        }
      }
      break;
    }

    case ChatEvents.GAME_INVITE: {
      const { receiver_id } = packet.data;
      const senderId = Number(userId);

      
     
      if ((await isBlocked(receiver_id, senderId)) || !onlineUsers.has(String(receiver_id)))
        return sendError(ws, "User is not available to play");

      const saved = await prisma.message.create({
        data: {
          senderId,
          receiverId: receiver_id,
          content: "Game invite",
          kind: "game_invite",
          meta: { gameId: crypto.randomUUID(), status: "pending" },
        },
      });

      setTimeout(() => settleInvite(saved.id, "expired").catch(console.error), INVITE_TTL_MS);

      const reply: ChatMessageIncoming = {
        id: saved.id,
        sender_id: saved.senderId,
        receiver_id: saved.receiverId,
        content: saved.content,
        created_at: saved.createdAt.toISOString(),
        read_at: null,
        kind: "game_invite",
        meta: saved.meta as ChatMessageIncoming["meta"],
      };
      const payload = JSON.stringify({
        event: ChatEvents.GAME_INVITE,
        data: reply,
      });

      // sender needs the real id/gameId back too, not just the receiver
      for (const [id, sockets] of [
        [String(receiver_id), onlineUsers.get(String(receiver_id))],
        [userId, onlineUsers.get(userId)],
      ] as const) {
        if (!sockets) continue;
        for (const socket of sockets)
          if (socket.readyState === WebSocket.OPEN) socket.send(payload);
      }
      break;
    }

     case ChatEvents.GAME_INVITE_REPLY: {
      await settleInvite(packet.data.message_id, packet.data.accept ? "accepted" : "declined", Number(userId));
      break;
    }
  }
}





// 3. Handling Disconnection (handleClose)
async function handleClose(ws: WebSocket, code: number, userId: string) {
  // console.log(`[CHAT-SERVICE] Client disconnected: ${userId} (Code: ${code})`);

  const sockets = onlineUsers.get(userId);
  if (!sockets) return;

  sockets.delete(ws);
  // Only drop to "offline" once their LAST socket closes.
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    const partners = await getMessagePartners(userId);
    broadcastPresenceToPartners(partners, Number(userId), "offline");
  }
}




// 4. Error Handling & Initialization (setupWebSocket)
function handleError(ws: WebSocket, err: Error) {
  console.error("[CHAT-SERVICE] Socket error:", err.message);
}





export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });
  const alive = new WeakSet<WebSocket>();

  wss.on("connection", (ws, req) => {
    alive.add(ws);
    ws.on("pong", () => alive.add(ws)); // browsers answer pings automatically
    handleConnection(ws, req);
  });

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
    .catch(console.error);


  console.log("[CHAT-SERVICE] WebSocket server initialized");
}