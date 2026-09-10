// shared/types/chat-types.ts
// Contract between: frontend (chat UI) <-> chat-service
// Edit here whenever the chat WS shape changes, both sides rebuild.

// --- Event names -----------------------------------------------------
// Add one entry per distinct thing that can happen over this channel.
export const ChatEvents = {
  MESSAGE: "message",   // a chat message sent/received
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

// Optional: "typing" indicator payload, if you add that feature.
export interface ChatTypingEvent {
  sender_id: number;
  receiver_id: number;
}