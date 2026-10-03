// shared/types/chat-types.ts
// Contract between: frontend (chat UI) <-> chat-service

// --- Event names -----------------------------------------------------
export const ChatEvents = {
  MESSAGE: "message",   // send/receive a chat message
  TYPING: "typing",     // "user is typing" indicator
  PRESENCE: "presence",
  READ: "read",
  GAME_INVITE: "gameInvite",
  GAME_INVITE_REPLY: "gameInviteReply",
} as const;

export type ChatEvent = typeof ChatEvents[keyof typeof ChatEvents];

// --- Payload shapes ----------------------------------------------------
// What the client SENDS when posting a new message.
export interface ChatMessageOutgoing {
  receiver_id: number;
  content: string;
}

// What the service SENDS BACK (stored + enriched with id/timestamp).
export interface ChatMessageIncoming {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string; // ISO string
  kind: 'text' | 'game_invite' | 'system';
  read_at: string | null;
  meta: { 
    gameId?: string; 
    status?: 'pending' | 'accepted' | 'declined'; 
  } | null;
}

// Sent from client -> server when typing
export interface ChatTypingOutgoing {
  receiver_id: number;
}

// Broadcast from server -> client when someone is typing
export interface ChatTypingEvent {
  sender_id: number;
}

// Sent from client -> server when marking messages as read
export interface ChatReadOutgoing {
  sender_id: number;
}

// Broadcast from server -> client when a friend marks your messages as read
export interface ChatReadEvent { 
  reader_id: number; 
  read_at: string; 
}

export interface ChatPresenceEvent {
  user_id: number;
  status: 'online' | 'offline';
}

// Sent from client -> server to initiate a game invite
export interface ChatInviteOutgoing { 
  receiver_id: number; 
}

// Sent from client -> server when responding to a game invite card
export interface ChatInviteReply { 
  message_id: number; 
  accept: boolean; 
}

// --- Envelopes ----------------------------------------------------------
export type ChatClientMessage =
  | { event: typeof ChatEvents.MESSAGE; data: ChatMessageOutgoing }
  | { event: typeof ChatEvents.TYPING; data: ChatTypingOutgoing }
  | { event: typeof ChatEvents.READ; data: ChatReadOutgoing }
  | { event: typeof ChatEvents.GAME_INVITE; data: ChatInviteOutgoing }
  | { event: typeof ChatEvents.GAME_INVITE_REPLY; data: ChatInviteReply };

export type ChatServerMessage =
  | { event: typeof ChatEvents.MESSAGE; data: ChatMessageIncoming }
  | { event: typeof ChatEvents.PRESENCE; data: ChatPresenceEvent }
  | { event: typeof ChatEvents.TYPING; data: ChatTypingEvent }          // <-- Uses sender_id
  | { event: typeof ChatEvents.READ; data: ChatReadEvent }              // <-- Uses reader_id + read_at
  | { event: typeof ChatEvents.GAME_INVITE; data: ChatMessageIncoming } // Invites/replies arrive as formatted messages
  | { event: typeof ChatEvents.GAME_INVITE_REPLY; data: ChatMessageIncoming };