import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatEvents as E } from '../../../shared/types/chat-types';
import type {
  ChatMessageIncoming as Message,
  ChatClientMessage,
  ChatServerMessage,
} from '../../../shared/types/chat-types';


/* ---------------- Types ---------------- */

export interface Friend {
  id: number;
  username: string;
  avatar?: string | null;
  online: boolean;
}

// Result of loading the history of one friend
interface LoadedState {
  friendId: number;
  ok: boolean;
}


/* ---------------- Helpers ---------------- */

// Call the chat service (adds the JWT token)
function callApi(token: string, path: string, method = 'GET') {
  return fetch(`/api/chat/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Add messages to the list, or replace them if the id already exists
// (a game-invite reply has the same id as its invite, so it replaces it)
function addMessages(newMessages: Message[]) {
  return (oldMessages: Record<number, Message>) => {
    const copy = { ...oldMessages };
    for (const message of newMessages) {
      copy[message.id] = message;
    }
    return copy;
  };
}


/** Everything the chat page needs: friends, the selected conversation, and the live websocket events. */
export default function useChat(token: string | null) {

  /* ---------------- State ---------------- */

  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [selectedId, setSelectedId] = useState(0);
  const [messages, setMessages] = useState<Record<number, Message>>({}); // by message id
  const [loaded, setLoaded] = useState<LoadedState | null>(null);
  const [blocked, setBlocked] = useState<Record<number, boolean>>({});     // "I blocked this friend"
  const [blockedBy, setBlockedBy] = useState<Record<number, boolean>>({}); // "this friend blocked me"
  const [presence, setPresence] = useState<Record<number, boolean>>({});   // friend id -> online
  const [typing, setTyping] = useState<Record<number, boolean>>({});
  const [readAt, setReadAt] = useState<Record<number, string>>({});
  const [error, setError] = useState('');
  const [reconnecting, setReconnecting] = useState(false); // websocket is down and being retried

  const socket = useRef<WebSocket | null>(null);
  const typedAt = useRef<Record<number, number>>({}); // when we last sent "typing", per friend


  /* ---------------- Derived values ---------------- */

  // The selected friend (the first one until the user picks another)
  const selectedFriend = friendList.find((f) => f.id === selectedId);
  const friendId = selectedFriend?.id ?? friendList[0]?.id ?? 0;

  const iBlockedThem = blocked[friendId] ?? false;
  const theyBlockedMe = blockedBy[friendId] ?? false;

  // A friend blocked (by either side) looks offline
  const friends = friendList.map((f) => {
    const isBlocked = blocked[f.id] || blockedBy[f.id];
    const isOnline = presence[f.id] ?? f.online;
    return { ...f, online: !isBlocked && isOnline };
  });

  //The loading status(default to loading)
  let status: 'loading' | 'error' | 'ok' = 'loading';
  if (loaded?.friendId === friendId) {
    status = loaded.ok ? 'ok' : 'error';
  }

  // Send a packet only if the socket is open
  const send = useCallback((packet: ChatClientMessage) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(packet));
    }
  }, []);


  /* ---------------- Loading data (REST) ---------------- */

  // Friends list (once, when we have a token)
  useEffect(() => {
    if (!token) return;

    async function loadFriends() {
      try {
        const res = await callApi(token!, 'friends');
        setFriendList(res.ok ? await res.json() : []);
      } catch {
        // ignore errors
      }
    }

    loadFriends();
  }, [token]);


  // History + block status: when the friend changes and after a reconnect (to catch up on missed messages)
  useEffect(() => {
    if (!token || !friendId || reconnecting) return;

    let stale = false; // true if the user already switched to another friend

    async function loadHistory() {
      try {
        const res = await callApi(token!, `messages/${friendId}`);
        if (!res.ok) throw false;
        const data: Message[] = await res.json();
        if (stale) return;
        setMessages(addMessages(data));
        setLoaded({ friendId, ok: true });
      } catch {
        if (!stale) setLoaded({ friendId, ok: false });
      }
    }

    async function loadBlockStatus() {
      try {
        const res = await callApi(token!, `blocks/status/${friendId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (stale || !data) return;
        setBlocked((old) => ({ ...old, [friendId]: data.iBlockedThem }));
        setBlockedBy((old) => ({ ...old, [friendId]: data.theyBlockedMe }));
      } catch {
        // ignore errors
      }
    }

    loadHistory();
    loadBlockStatus();

    return () => {
      stale = true;
    };
  }, [token, friendId, reconnecting]);


  /* ---------------- WebSocket (live events) ---------------- */

  // One WebSocket connection for the page, with automatic reconnects
  useEffect(() => {
    if (!token) return;

    let ws: WebSocket;
    let closed = false; // true when the page is leaving (do not reconnect)
    let retries = 0;    //How many times in a row we failed to connect
    let retryTimer: ReturnType<typeof setTimeout>;  // takes the type of return type of setTimeout
    const typingTimers: Record<number, ReturnType<typeof setTimeout>> = {};

    // Show the typing indicator for 2s, then hide it
    function showTyping(id: number, on: boolean) {
      clearTimeout(typingTimers[id]);
      setTyping((old) => ({ ...old, [id]: on }));

      if (on) {
        typingTimers[id] = setTimeout(() => {
          setTyping((old) => ({ ...old, [id]: false }));
        }, 2000);
      }
    }

    // Every server packet comes here, handled by its event type
    function handlePacket(packet: ChatServerMessage) {
      switch (packet.event) {

        // Messages, invites and invite replies all arrive as a full message
        case E.MESSAGE:
        case E.GAME_INVITE:
        case E.GAME_INVITE_REPLY:
          if (packet.event === E.MESSAGE) showTyping(packet.data.sender_id, false);
          setMessages(addMessages([packet.data]));
          break;

        // A friend went online / offline
        case E.PRESENCE: {
          const { user_id, status } = packet.data;
          setPresence((old) => ({ ...old, [user_id]: status === 'online' }));
          break;
        }

        case E.TYPING:
          showTyping(packet.data.sender_id, true);
          break;

        // The friend read our messages (turns ✓ into ✓✓)
        case E.READ: {
          const { reader_id, read_at } = packet.data;
          setReadAt((old) => ({ ...old, [reader_id]: read_at }));
          break;
        }

        // The blocker is the friend, so this means "they blocked me"
        case E.BLOCK_UPDATED: {
          const { blockerId, blocked } = packet.data;
          setBlockedBy((old) => ({ ...old, [blockerId]: blocked }));
          break;
        }

        // Server-side error, shown for 3s
        case E.ERROR:
          setError(packet.data.message);
          setTimeout(() => setError(''), 3000);
          break;
      }
    }

    function connect() {
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
        const delay = Math.min(1000 * 2 ** retries, 15000);
        retries++;
        retryTimer = setTimeout(connect, delay); //Schedule the retry after delay milliseconds
      };

      ws.onmessage = (event) => {
        try {
          handlePacket(JSON.parse(event.data));
        } catch {
          // ignore packets we can't read
        }
      };
    }

    connect();

    // Cleanup: stop reconnecting and close everything
    return () => {
      closed = true;
      clearTimeout(retryTimer);
      Object.values(typingTimers).forEach(clearTimeout);
      ws.close();
    };
  }, [token]);


  /* ---------------- Conversation ---------------- */

  // Messages with the selected friend, oldest first
  const conversation = Object.values(messages)
    .filter((m) => m.sender_id === friendId || m.receiver_id === friendId)
    .sort((a, b) => a.id - b.id);


  // Mark the conversation as read, and again when the tab becomes visible
  useEffect(() => {
    function markRead() {
      if (friendId && document.visibilityState === 'visible') {
        send({ event: E.READ, data: { sender_id: friendId } });
      }
    }

    markRead();
    document.addEventListener('visibilitychange', markRead);

    return () => document.removeEventListener('visibilitychange', markRead);
  }, [conversation.length, friendId, reconnecting, send]);


  /* ---------------- Actions ---------------- */

  function sendMessage(content: string) {
    send({ event: E.MESSAGE, data: { receiver_id: friendId, content } });
  }

  function sendInvite() {
    send({ event: E.GAME_INVITE, data: { receiver_id: friendId } });
  }

  function replyInvite(message_id: number, accept: boolean) {
    send({ event: E.GAME_INVITE_REPLY, data: { message_id, accept } });
  }

  // Tell the friend we're typing, at most once every 2s
  function sendTyping() {
    const lastTime = typedAt.current[friendId] ?? 0;
    if (Date.now() - lastTime < 2000) return;

    typedAt.current[friendId] = Date.now();
    send({ event: E.TYPING, data: { receiver_id: friendId } });
  }

  // Block or unblock the selected friend
  async function toggleBlock() {
    if (!token) return;

    try {
      const method = iBlockedThem ? 'DELETE' : 'POST';
      const res = await callApi(token, `blocks/${friendId}`, method);
      if (res.ok) setBlocked((old) => ({ ...old, [friendId]: !iBlockedThem }));
    } catch {
      // ignore errors
    }
  }


  /* ---------------- What the page can use ---------------- */

  return {
    friends,
    friend: friends.find((f) => f.id === friendId),
    select: setSelectedId,
    conversation,
    status,
    error,
    reconnecting,
    blocked: iBlockedThem,
    blockedByThem: theyBlockedMe,
    typing: typing[friendId] ?? false,
    friendReadAt: readAt[friendId] ?? null,

    sendMessage,
    sendInvite,
    replyInvite,
    sendTyping,
    toggleBlock,
  };
}