// Contract between: frontend (chat UI) <-> chat-service
import type { NotificationSocketData } from "./notification-types";

export const ChatEvents = {
  MESSAGE: "message",
  TYPING: "typing",
  PRESENCE: "presence",
  READ: "read",
  GAME_INVITE: "gameInvite",
  GAME_INVITE_REPLY: "gameInviteReply",
  NOTIFICATION: "notification",
} as const;

// A stored message (text, game invite, or system line). Used by the websocket AND the REST history.
export interface ChatMessageIncoming {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string; // ISO string
  read_at: string | null;
  kind: "text" | "game_invite" | "system";
  meta: { gameId?: string; status?: "pending" | "accepted" | "declined" } | null;
}

export interface ChatPresenceEvent {
  user_id: number;
  status: "online" | "offline";
}

// Client -> server
export type ChatClientMessage =
  | { event: typeof ChatEvents.MESSAGE; data: { receiver_id: number; content: string } }
  | { event: typeof ChatEvents.TYPING; data: { receiver_id: number } }
  | { event: typeof ChatEvents.READ; data: { sender_id: number } } // "I read messages from sender_id"
  | { event: typeof ChatEvents.GAME_INVITE; data: { receiver_id: number } }
  | { event: typeof ChatEvents.GAME_INVITE_REPLY; data: { message_id: number; accept: boolean } };

// Server -> client (invites and replies arrive as full messages)
export type ChatServerMessage =
  | { event: typeof ChatEvents.MESSAGE; data: ChatMessageIncoming }
  | { event: typeof ChatEvents.GAME_INVITE; data: ChatMessageIncoming }
  | { event: typeof ChatEvents.GAME_INVITE_REPLY; data: ChatMessageIncoming }
  | { event: typeof ChatEvents.PRESENCE; data: ChatPresenceEvent }
  | { event: typeof ChatEvents.TYPING; data: { sender_id: number } }
  | { event: typeof ChatEvents.READ; data: { reader_id: number; read_at: string } }
  | { event: typeof ChatEvents.NOTIFICATION; data: NotificationSocketData };