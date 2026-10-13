import { useRef, useState, useEffect  } from 'react';
// import React from 'react';
import type { 
//   ChatMessageOutgoing, 
  ChatMessageIncoming, 
  ChatClientMessage, 
  ChatServerMessage,
} from '../../../../shared/types/chat-types';
import { ChatEvents } from '../../../../shared/types/chat-types';


export default function useChatSocket(url: string)
{
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [messages, setMessages] = useState<ChatMessageIncoming[]>([]);
    const [presence, setPresence] = useState<Record<number, 'online' | 'offline'>>({});
    const [typing, setTyping] = useState<Record<number, boolean>>({});
    const typingTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const [readAt, setReadAt] = useState<Record<number, string>>({});


    useEffect(() => {
        if (!url) return;
        
        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {setIsConnected(true);};
        ws.onclose = () => {setIsConnected(false);};
        ws.onerror = (error) => {console.error("WebSocket error:", error);};

        ws.onmessage = (event) => {
            let packet: ChatServerMessage;
            try {
                packet = JSON.parse(event.data);
            } catch (err) {
                console.warn('[CHAT-CLIENT] Invalid JSON received, ignoring:', event.data);
                return;
            }

            switch (packet.event)
            {
                case ChatEvents.MESSAGE:
                {
                    // Clear their typing timer and status immediately
                    const senderId = packet.data.sender_id;
                    if (typingTimers.current[senderId]) {
                        clearTimeout(typingTimers.current[senderId]);
                    }
                    setTyping((prev) => ({ ...prev, [senderId]: false }));


                    setMessages(prevMessages => [...prevMessages, packet.data]);
                    break;
                }


                case ChatEvents.PRESENCE:
                {
                    setPresence(prevPresence => ({
                        ...prevPresence, [packet.data.user_id]: packet.data.status
                    }));
                    break;
                }

                case ChatEvents.TYPING:
                {
                    const senderId = packet.data.sender_id;

                    // 1. Clear previous timer if it exists
                    if (typingTimers.current[senderId]) {
                        clearTimeout(typingTimers.current[senderId]);
                    }

                    // 2. Set typing status to true
                    setTyping(pervTyping => ({
                        ...pervTyping, [senderId]: true
                    }));


                    // 3. Set a 2-second timeout to turn it back to false
                    typingTimers.current[senderId] = setTimeout(() => {
                        setTyping((prev) => ({ ...prev, [senderId]: false }));
                    }, 2000);

                    break;
                }

                case ChatEvents.READ: {
                    const readerId = packet.data.reader_id;
                    const readTimestamp = packet.data.read_at;

                    setReadAt((prev) => ({ ...prev, [readerId]: readTimestamp }));
                    break;
                }
            }
        }

        


        return () => {
            // Clear all active typing timeout timers
            Object.values(typingTimers.current).forEach(clearTimeout);
            ws.close();
        };
    }, [url]);

    function sendMessage(receiver_id: number, content: string)
    {
        if(!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
            return;

        const outgoing: ChatClientMessage = {
            event: ChatEvents.MESSAGE,
            data: { receiver_id, content}
        }

        socketRef.current.send(JSON.stringify(outgoing));
    }


    function sendTyping(receiverId: number) {
        if(!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
            return;
        
        const outgoing: ChatClientMessage = {
            event: ChatEvents.TYPING,
            data: { receiver_id: receiverId }
        }

        socketRef.current.send(JSON.stringify(outgoing));
    }

    function sendRead(senderId: number)
    {
        if(!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
            return;
        
        const outgoing: ChatClientMessage = {
            event: ChatEvents.READ,
            data: { sender_id: senderId }
        }

        socketRef.current.send(JSON.stringify(outgoing));
    }

    return { isConnected, messages, presence,
         sendMessage, typing, sendTyping, sendRead,readAt };
}