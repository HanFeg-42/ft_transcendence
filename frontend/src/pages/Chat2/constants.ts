// Props = the data a parent gives to a child component.
import type { Friend, Message } from './types';


export const MOCK_FRIENDS: Friend[] = [
  { id: 1, username: 'user1', status: 'online' },
  { id: 2, username: 'user2', status: 'offline' },
  { id: 3, username: 'user3', status: 'online' },
];


export const MOCK_MESSAGES: Message[] = [
  { id: 1, sender_id: 2, receiver_id: 1, content: 'hello there', created_at: "2026-10-09T09:30:00Z"},
  { id: 2, sender_id: 3, receiver_id: 1, content: 'hello there', created_at: "2026-10-09T09:30:00Z"},
  { id: 3, sender_id: 2, receiver_id: 1, content: 'hello there', created_at: "2026-10-09T09:30:00Z"},
  { id: 1, sender_id: 2, receiver_id: 1, content: 'hello there', created_at: "2026-10-09T09:30:00Z"},
  { id: 2, sender_id: 1, receiver_id: 1, content: 'hello there', created_at: "2026-10-09T09:30:00Z"},
  { id: 3, sender_id: 2, receiver_id: 1, content: 'hello there', created_at: "2026-10-09T09:30:00Z"},
];

