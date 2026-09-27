import type { IconName } from '../../utils/icons';

// Shape of a message coming back from the chat history REST endpoint
// (and used for live WS messages too, since both render the same way).
export interface HistoryMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

export interface Friend {
  id: number;
  username: string;
  icon: IconName;
  status: 'online' | 'offline' | 'busy';
}

export interface BlockStatus {
  iBlockedThem: boolean;
  theyBlockedMe: boolean;
}