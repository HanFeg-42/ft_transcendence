// shared/types/chat-types.ts
// Contract between: frontend (chat UI) <-> chat-service

// --- Event names -----------------------------------------------------
export const ChatEvents = {
  MESSAGE: "message",   // send/receive a chat message
  TYPING: "typing",     // optional: "user is typing" indicator
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
}

// Optional: "typing" indicator payload, if that feature gets added.
export interface ChatTypingEvent {
  sender_id: number;
  receiver_id: number;
}