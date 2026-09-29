import { useEffect, useRef, useState } from 'react';
import { ChatEvents } from '../../../shared/types/chat-types';
import type { 
  ChatMessageOutgoing, 
  ChatMessageIncoming, 
  ChatClientMessage, 
  ChatServerMessage 
} from '../../../shared/types/chat-types';

export function useChatSocket(url: string, currentUserId: number) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessageIncoming[]>([]);
  const [presence, setPresence] = useState<Record<number, 'online' | 'offline'>>({});
  
  // Step 1: Typing state management
  const [typing, setTyping] = useState<Record<number, boolean>>({});
  const typingTimeoutsRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!url) return;

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
      // Clean up typing timers on unmount
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
    };
  }, [url]);

  function handleMessage(event: MessageEvent) {
    let packet: ChatServerMessage;
    try {
      packet = JSON.parse(event.data);
    } catch (err) {
      console.warn('[CHAT-CLIENT] Invalid JSON received, ignoring:', event.data);
      return;
    }

    switch (packet.event) {
      case ChatEvents.MESSAGE: {
        const message = packet.data;
        console.log('[CHAT-CLIENT] Message received:', message);
        setMessages((prev) => [...prev, message]);

        // Clear typing indicator when a real message arrives from that user
        const senderId = message.sender_id;
        if (typingTimeoutsRef.current[senderId]) {
          clearTimeout(typingTimeoutsRef.current[senderId]);
          delete typingTimeoutsRef.current[senderId];
        }
        setTyping((prev) => ({ ...prev, [senderId]: false }));
        break;
      }

      case ChatEvents.PRESENCE: {
        const { user_id, status } = packet.data;
        setPresence((prev) => ({ ...prev, [user_id]: status }));
        break;
      }

      case ChatEvents.TYPING: {
        const senderId = packet.data.sender_id;

        setTyping((prev) => ({ ...prev, [senderId]: true }));

        // Reset existing timer if user sends another typing event
        if (typingTimeoutsRef.current[senderId]) {
          clearTimeout(typingTimeoutsRef.current[senderId]);
        }

        // Auto-clear typing indicator after 3 seconds
        typingTimeoutsRef.current[senderId] = setTimeout(() => {
          setTyping((prev) => ({ ...prev, [senderId]: false }));
          delete typingTimeoutsRef.current[senderId];
        }, 3000);
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

    // Optimistic local update with updated ChatMessageIncoming structure
    const ownCopy: ChatMessageIncoming = {
      id: -Date.now(),
      sender_id: currentUserId,
      receiver_id,
      content,
      created_at: new Date().toISOString(),
      kind: 'text',
      read_at: null,
      meta: null,
    };
    setMessages((prev) => [...prev, ownCopy]);
  }

  // Helper function to send typed WebSocket events
  function sendJsonMessage(packet: ChatClientMessage) {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(packet));
    }
  }

  return { isConnected, messages, sendMessage, sendJsonMessage, presence, typing };
}