import { useEffect, useRef, useState } from 'react';

// Import shared WebSocket contract rules (event names and payload shapes)
import { ChatEvents } from '../../../shared/types/chat-types';
import type { ChatMessageOutgoing, ChatMessageIncoming } from '../../../shared/types/chat-types';

export function useChatSocket(url: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
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

  function handleMessage(event: MessageEvent) {
    const packet = JSON.parse(event.data);

    if (packet.event === ChatEvents.MESSAGE) {
      const message: ChatMessageIncoming = packet.data;
      console.log('[CHAT-CLIENT] Message received:', message);

      // TODO: append to conversation state / render in UI
    }
  }

  function sendMessage(receiver_id: number, content: string) {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[CHAT-CLIENT] Cannot send message, socket not connected');
      return;
    }

    const payload: ChatMessageOutgoing = { receiver_id, content };

    socketRef.current.send(
      JSON.stringify({
        event: ChatEvents.MESSAGE,
        data: payload,
      })
    );
  }

  return { isConnected, sendMessage };
}