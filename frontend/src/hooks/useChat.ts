import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatEvents as E } from '../../../shared/types/chat-types';
import type {
  ChatMessageIncoming as Message,
  ChatClientMessage,
  ChatServerMessage,
} from '../../../shared/types/chat-types';


export interface Friend {
  id: number;
  username: string;
  avatar?: string | null;
  online: boolean;
}


// Small helper for REST calls to the chat service (adds the JWT)
const api = (token: string, path: string, method = 'GET') =>
  fetch(`/api/chat/${path}`, { method, headers: { Authorization: `Bearer ${token}` } });


// Add or replace messages by id (a game-invite reply has the same id as its invite, so it replaces it).
const upsert = (list: Message[]) => (prev: Record<number, Message>) => ({
  ...prev,
  ...Object.fromEntries(list.map((m) => [m.id, m])),
});


/** Everything the chat page needs: friends, the selected conversation, and the live websocket events. */
export default function useChat(token: string | null) {

  /* ---------------- State ---------------- */

  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [selectedId, select] = useState(0);
  const [messages, setMessages] = useState<Record<number, Message>>({}); // REST history + websocket, by id
  const [loaded, setLoaded] = useState<{ friendId: number; ok: boolean } | null>(null);
  const [blocked, setBlocked] = useState<Record<number, boolean>>({}); // "I blocked this friend"
  const [blockedBy, setBlockedBy] = useState<Record<number, boolean>>({}); // "this friend blocked me"
  const [presence, setPresence] = useState<Record<number, boolean>>({}); // friend id -> online
  const [typing, setTyping] = useState<Record<number, boolean>>({});
  const [readAt, setReadAt] = useState<Record<number, string>>({});
  const [error, setError] = useState('');
  const [reconnecting, setReconnecting] = useState(false); // websocket is down and being retried

  const socket = useRef<WebSocket | null>(null);
  const typedAt = useRef<Record<number, number>>({}); // when we last sent "typing", per friend


  /* ---------------- Derived values ---------------- */

  // The selected friend (the first one until the user picks another)
  const friendId = friendList.find((f) => f.id === selectedId)?.id ?? friendList[0]?.id ?? 0;
  const iBlockedThem = blocked[friendId] ?? false;
  const theyBlockedMe = blockedBy[friendId] ?? false;

  const friends = friendList.map((f) => ({
    ...f,
    online: !(blocked[f.id] || blockedBy[f.id]) && (presence[f.id] ?? f.online), // blocked (by either side) looks offline
  }));

  const status: 'loading' | 'error' | 'ok' = loaded?.friendId !== friendId ? 'loading' : loaded.ok ? 'ok' : 'error';

  // Send a packet only if the socket is open
  const send = useCallback((packet: ChatClientMessage) => {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(packet));
  }, []);


  /* ---------------- Loading data (REST) ---------------- */

  // Friends list (once, when we have a token)
  useEffect(() => {
    if (!token) return;

    api(token, 'friends')
      .then((r) => (r.ok ? r.json() : []))
      .then(setFriendList)
      .catch(() => {});
  }, [token]);


  // History + block status: on friend change and after a reconnect (to catch up on missed messages).
  useEffect(() => {
    if (!token || !friendId || reconnecting) return;

    let stale = false; // ignore the answer if the user already switched friend

    api(token, `messages/${friendId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Message[]) => {
        if (stale) return;
        setMessages(upsert(data));
        setLoaded({ friendId, ok: true });
      })
      .catch(() => !stale && setLoaded({ friendId, ok: false }));

    api(token, `blocks/status/${friendId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (stale || !data) return;
        setBlocked((b) => ({ ...b, [friendId]: data.iBlockedThem }));
        setBlockedBy((b) => ({ ...b, [friendId]: data.theyBlockedMe }));
      })
      .catch(() => {});

    return () => {
      stale = true;
    };
  }, [token, friendId, reconnecting]);


  /* ---------------- WebSocket (live events) ---------------- */

  // One WebSocket connection for the page, with automatic reconnects.
  useEffect(() => {
    if (!token) return;

    let ws: WebSocket;
    let closed = false; // true when the page is leaving (do not reconnect)
    let retries = 0;
    let retry: ReturnType<typeof setTimeout>;
    const timers: Record<number, ReturnType<typeof setTimeout>> = {};

    // Show the typing indicator for 2s, then hide it
    const showTyping = (id: number, on: boolean) => {
      clearTimeout(timers[id]);
      setTyping((p) => ({ ...p, [id]: on }));
      if (on) timers[id] = setTimeout(() => setTyping((p) => ({ ...p, [id]: false })), 2000);
    };

    const connect = () => {
      ws = new WebSocket(`wss://${window.location.host}/api/chat/ws?token=${token}`);
      socket.current = ws;

      ws.onopen = () => {
        retries = 0;
        setReconnecting(false);
      };

      // Reconnect with exponential backoff: 1s, 2s, 4s ... max 15s
      ws.onclose = () => {
        if (closed) return;
        setReconnecting(true);
        retry = setTimeout(connect, Math.min(1000 * 2 ** retries++, 15000));
      };

      // Every server packet comes here, handled by its event type
      ws.onmessage = (event) => {
        let packet: ChatServerMessage;

        try {
          packet = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (packet.event) {

          // Messages, invites and invite replies all arrive as a full message
          case E.MESSAGE:
          case E.GAME_INVITE:
          case E.GAME_INVITE_REPLY:
            if (packet.event === E.MESSAGE) showTyping(packet.data.sender_id, false);
            setMessages(upsert([packet.data]));
            break;

          // A friend went online / offline
          case E.PRESENCE: {
            const { user_id, status } = packet.data;
            setPresence((p) => ({ ...p, [user_id]: status === 'online' }));
            break;
          }

          case E.TYPING:
            showTyping(packet.data.sender_id, true);
            break;

          // The friend read our messages (turns ✓ into ✓✓)
          case E.READ: {
            const { reader_id, read_at } = packet.data;
            setReadAt((p) => ({ ...p, [reader_id]: read_at }));
            break;
          }

          // Someone blocked / unblocked: the blocker is the friend, so this means "they blocked me"
          case E.BLOCK_UPDATED: {
            const { blockerId, blocked } = packet.data;
            setBlockedBy((b) => ({ ...b, [blockerId]: blocked }));
            break;
          }

          // Server-side error, shown for 3s
          case E.ERROR:
            setError(packet.data.message);
            setTimeout(() => setError(''), 3000);
            break;
        }
      };
    };

    connect();

    // Cleanup: stop reconnecting and close everything
    return () => {
      closed = true;
      clearTimeout(retry);
      Object.values(timers).forEach(clearTimeout);
      ws.close();
    };
  }, [token]);


  /* ---------------- Conversation ---------------- */

  // Messages for the selected friend, oldest first
  const conversation = Object.values(messages)
    .filter((m) => m.sender_id === friendId || m.receiver_id === friendId)
    .sort((a, b) => a.id - b.id);


  // Mark this conversation as read, and again when the tab becomes visible
  useEffect(() => {
    const markRead = () => {
      if (friendId && document.visibilityState === 'visible') send({ event: E.READ, data: { sender_id: friendId } });
    };

    markRead();
    document.addEventListener('visibilitychange', markRead);

    return () => document.removeEventListener('visibilitychange', markRead);
  }, [conversation.length, friendId, reconnecting, send]);


  /* ---------------- What the page can use ---------------- */

  return {
    friends,
    friend: friends.find((f) => f.id === friendId),
    select,
    conversation,
    status,
    error,
    reconnecting,
    blocked: iBlockedThem,
    blockedByThem: theyBlockedMe,
    typing: typing[friendId] ?? false,
    friendReadAt: readAt[friendId] ?? null,

    sendMessage: (content: string) => send({ event: E.MESSAGE, data: { receiver_id: friendId, content } }),
    sendInvite: () => send({ event: E.GAME_INVITE, data: { receiver_id: friendId } }),
    replyInvite: (message_id: number, accept: boolean) =>
      send({ event: E.GAME_INVITE_REPLY, data: { message_id, accept } }),

    // Tell the friend we're typing, at most once every 2s
    sendTyping: () => {
      if (Date.now() - (typedAt.current[friendId] ?? 0) < 2000) return;
      typedAt.current[friendId] = Date.now();
      send({ event: E.TYPING, data: { receiver_id: friendId } });
    },

    // Block or unblock the selected friend
    toggleBlock: async () => {
      if (!token) return;
      const res = await api(token, `blocks/${friendId}`, iBlockedThem ? 'DELETE' : 'POST').catch(() => undefined);
      if (res?.ok) setBlocked((b) => ({ ...b, [friendId]: !iBlockedThem }));
    },
  };
}