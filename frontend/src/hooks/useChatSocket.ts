import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { ChatEvents } from '../../../shared/types/chat-types';
import type { 
  ChatMessageOutgoing, 
  ChatMessageIncoming, 
  ChatClientMessage, 
  ChatServerMessage 
} from '../../../shared/types/chat-types';

export function useChatSocket(url: string, currentUserId: number,
  openFriendIdRef: React.RefObject<number | null>,
) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessageIncoming[]>([]);
  const [presence, setPresence] = useState<Record<number, 'online' | 'offline'>>({});
  
  
  const [typing, setTyping] = useState<Record<number, boolean>>({});
  const typingTimeoutsRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [readAt, setReadAt] = useState<Record<number, string>>({});

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
        // setMessages((prev) => [...prev, message]);

          setMessages((prev) => {
          // our own message echoed back with the server's real id/timestamps —
          // replace the optimistic placeholder instead of duplicating it
          if (message.sender_id === currentUserId) {
            const i = prev.findIndex(
              (m) => m.id < 0 && m.receiver_id === message.receiver_id && m.content === message.content
            );
            if (i !== -1) {
              const next = [...prev];
              next[i] = message;
              return next;
            }
          }
          return [...prev, message];
        });

        // Clear typing indicator when a real message arrives from that user
        const senderId = message.sender_id;
        if (typingTimeoutsRef.current[senderId]) {
          clearTimeout(typingTimeoutsRef.current[senderId]);
          delete typingTimeoutsRef.current[senderId];
        }
        setTyping((prev) => ({ ...prev, [senderId]: false }));

          if (
            message.sender_id === openFriendIdRef.current &&
            document.visibilityState === 'visible'
          ) {
            sendJsonMessage({
              event: ChatEvents.READ,
              data: {
                sender_id: message.sender_id,
              },
            });
          }

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

      case ChatEvents.READ: {
        const { reader_id, read_at } = packet.data;
        setReadAt((prev) => ({ ...prev, [reader_id]: read_at }));
        break;
      }


      case ChatEvents.GAME_INVITE: {
        setMessages((prev) => [...prev, packet.data]);
        break;
      }
      case ChatEvents.GAME_INVITE_REPLY: {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === packet.data.id);
          return exists ? prev.map((m) => (m.id === packet.data.id ? packet.data : m)) : [...prev, packet.data];
        });
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

  function sendTyping(receiver_id: number) {
      sendJsonMessage({ event: ChatEvents.TYPING, data: { receiver_id } });
  }

  function sendRead(sender_id: number) {
  sendJsonMessage({ event: ChatEvents.READ, data: { sender_id } });
}


function sendInvite(receiver_id: number) {
  sendJsonMessage({ event: ChatEvents.GAME_INVITE, data: { receiver_id } });
}
function sendInviteReply(message_id: number, accept: boolean) {
  sendJsonMessage({ event: ChatEvents.GAME_INVITE_REPLY, data: { message_id, accept } });
}

  // Helper function to send typed WebSocket events
  function sendJsonMessage(packet: ChatClientMessage) {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(packet));
    }
  }

  return { isConnected, messages, sendMessage, sendJsonMessage,
     presence, typing, readAt, sendRead, sendTyping, sendInvite, sendInviteReply};
}