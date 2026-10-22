import { useEffect, useRef, useState } from 'react';
import { ChatEvents } from '../../../../shared/types/chat-types';
import type {
  ChatMessageIncoming as Message,
  ChatClientMessage,
  ChatServerMessage,
} from '../../../../shared/types/chat-types';

const api = (token: string, path: string, method = 'GET') =>
  fetch(`/api/chat/${path}`, { method, headers: { Authorization: `Bearer ${token}` } });

/** Everything the chat page needs from the backend, for the selected friend. */
export default function useChat(token: string | null, friendId: number) {
  const [history, setHistory] = useState<Message[]>([]); // loaded from the REST API
  const [live, setLive] = useState<Message[]>([]); // received through the websocket
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [iBlockedThem, setIBlockedThem] = useState(false);
  const [presence, setPresence] = useState<Record<number, 'online' | 'offline'>>({});
  const [typing, setTyping] = useState<Record<number, boolean>>({});
  const [readAt, setReadAt] = useState<Record<number, string>>({});
  const socket = useRef<WebSocket | null>(null);
  const [error, setError] = useState('');
  const [reconnecting, setReconnecting] = useState(false);


  // History + block status, reloaded when the selected friend changes.
  useEffect(() => {
    if (!token || !friendId || reconnecting) return;
    let stale = false;
    setStatus('loading');

    api(token, `messages/${friendId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Message[]) => {
        if (stale) return;
        setHistory([...data].reverse()); // API returns newest first
        setLive((prev) => prev.filter((m) => !data.some((h) => h.id === m.id)));
        setStatus('ok');
      })
      .catch(() => {
        if (!stale) setStatus('error');
      });

    api(token, `blocks/status/${friendId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!stale && data) setIBlockedThem(data.iBlockedThem);
      })
      .catch((err) => console.error('Failed to fetch block status', err));

    return () => {
      stale = true;
    };
  }, [token, friendId, reconnecting]);

  // One websocket for the whole page.
  useEffect(() => {
    if (!token) return;
    let ws: WebSocket;
    let retries = 0;
    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout>;
    const timers: Record<number, ReturnType<typeof setTimeout>> = {};

    const connect = () => {
      ws = new WebSocket(`wss://${window.location.host}/api/chat/ws?token=${token}`);
      socket.current = ws;
      ws.onopen = () => {
        retries = 0;
        setReconnecting(false);
      };
      ws.onclose = () => {
        if (closed) return;
        setReconnecting(true);
        retryTimer = setTimeout(connect, Math.min(1000 * 2 ** retries++, 15000)); // 1s, 2s, 4s ... max 15s
      };
      
      ws.onmessage = (event) => {
      let packet: ChatServerMessage;
      try {
        packet = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (packet.event) {
        // Messages, invites and invite replies share one shape. An invite reply has the same id as
        // the invite, so it is appended too and replaces it when the conversation is built below.
        case ChatEvents.MESSAGE:
        case ChatEvents.GAME_INVITE:
        case ChatEvents.GAME_INVITE_REPLY: {
          const msg = packet.data;
          if (packet.event === ChatEvents.MESSAGE) showTyping(msg.sender_id, false);
          setLive((prev) => [...prev, msg]);
          break;
        }
        case ChatEvents.PRESENCE: {
          const { user_id, status } = packet.data;
          setPresence((p) => ({ ...p, [user_id]: status }));
          break;
        }
        case ChatEvents.TYPING:
          showTyping(packet.data.sender_id, true);
          break;
        case ChatEvents.READ: {
          const { reader_id, read_at } = packet.data;
          setReadAt((p) => ({ ...p, [reader_id]: read_at }));
          // setReadAt((p) => (p[reader_id] && p[reader_id] >= read_at ? p : { ...p, [reader_id]: read_at }));
          break;
        }
        case ChatEvents.ERROR:
          setError(packet.data.message);
          setTimeout(() => setError(''), 3000);
          break;
      }
    };

    };
    connect();


    
    

    // Show "typing..." for a user; it switches itself off after 2s.
    const showTyping = (id: number, on: boolean) => {
      clearTimeout(timers[id]);
      setTyping((p) => ({ ...p, [id]: on }));
      if (on) timers[id] = setTimeout(() => setTyping((p) => ({ ...p, [id]: false })), 2000);
    };

    

    return () => {
      closed = true;
      clearTimeout(retryTimer);
      Object.values(timers).forEach(clearTimeout);
      ws.close();
    };
  }, [token]);

  function send(packet: ChatClientMessage) {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(packet));
  }

  async function toggleBlock() {
    if (!token) return;
    try {
      const res = await api(token, `blocks/${friendId}`, iBlockedThem ? 'DELETE' : 'POST');
      if (res.ok) setIBlockedThem(!iBlockedThem);
    } catch (err) {
      console.error('Failed to toggle block', err);
    }
  }

  const withFriend = (m: Message) => m.sender_id === friendId || m.receiver_id === friendId;
  const conversation = [...new Map([...history, ...live].filter(withFriend).map((m) => [m.id, m])).values()];

  return {
    conversation,
    status,
    presence,
    typing,
    readAt,
    error,
    iBlockedThem,
    toggleBlock,
    reconnecting,
    sendMessage: (receiver_id: number, content: string) =>
      send({ event: ChatEvents.MESSAGE, data: { receiver_id, content } }),
    sendTyping: (receiver_id: number) =>
      send({ event: ChatEvents.TYPING, data: { receiver_id } }),
    sendRead: (sender_id: number) =>
      send({ event: ChatEvents.READ, data: { sender_id } }),
    sendInvite: (receiver_id: number) =>
      send({ event: ChatEvents.GAME_INVITE, data: { receiver_id } }),
    replyInvite: (message_id: number, accept: boolean) =>
      send({ event: ChatEvents.GAME_INVITE_REPLY, data: { message_id, accept } }),
  };
}