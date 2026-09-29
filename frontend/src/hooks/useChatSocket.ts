import { useEffect, useRef, useState } from 'react';

// Import shared WebSocket contract rules (event names and payload shapes)
import { ChatEvents } from '../../../shared/types/chat-types';
import type { ChatMessageOutgoing, ChatMessageIncoming, ChatClientMessage, ChatServerMessage } from '../../../shared/types/chat-types';

// currentUserId is needed here because the server never echoes a message
// back to its sender (it only routes to the receiver) — so the hook has to
// build the sender's own copy locally, and that copy needs a real sender_id.
export function useChatSocket(url: string, currentUserId: number) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessageIncoming[]>([]);

  useEffect(() => {
    if (!url) return; // not authenticated yet — don't open a socket to a garbage URL

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[CHAT-CLIENT] Connected to server');
      setIsConnected(true);
    };

    ws.onmessage = (event: MessageEvent) => {
      handleMessage(event);
    };

    ws.onclose = (event: CloseEvent) => {
      console.log(`[CHAT-CLIENT] Connection closed (Code: ${event.code})`);
      setIsConnected(false);
    };

    ws.onerror = () => {
      console.error('[CHAT-CLIENT] Socket error observed');
    };

    return () => {
      ws.close();
    };
  }, [url]);


const [presence, setPresence] = useState<Record<number, 'online' | 'offline'>>({});


  function handleMessage(event: MessageEvent) {
    let packet: ChatServerMessage;
    try {
      packet = JSON.parse(event.data);
    } catch (err) {
      console.warn('[CHAT-CLIENT] Invalid JSON received, ignoring:', event.data);
      return; // drop the bad message, keep the connection alive
    }

    switch (packet.event) {
      case ChatEvents.MESSAGE: {
        const message = packet.data; // narrowed to ChatMessageIncoming, no cast needed
        console.log('[CHAT-CLIENT] Message received:', message);
        setMessages((prev) => [...prev, message]);
        break;
      }

    case ChatEvents.PRESENCE: {
      const { user_id, status } = packet.data;
      setPresence((prev) => ({ ...prev, [user_id]: status }));
      break;
    }
    }
  }

  function sendMessage(receiver_id: number, content: string) {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[CHAT-CLIENT] Cannot send message, socket not connected');
      return;
    }

    const payload: ChatMessageOutgoing = { receiver_id, content };

    const packet: ChatClientMessage = {
      event: ChatEvents.MESSAGE,
      data: payload,
    };

    socketRef.current.send(JSON.stringify(packet));

    // Optimistic append: the server only routes this to the RECEIVER, so the
    // sender's own UI update has to happen locally, not from onmessage.
    // id is a client-side placeholder (server would assign the real one if
    // this were persisted) — fine for basic chat since nothing re-reads it.
    const ownCopy: ChatMessageIncoming = {
      id: -Date.now(),
      sender_id: currentUserId,
      receiver_id,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, ownCopy]);
  }

  return { isConnected, messages, sendMessage, presence }; 
}