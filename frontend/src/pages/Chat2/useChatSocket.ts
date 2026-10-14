import { useRef, useState, useEffect  } from 'react';
// import React from 'react';
import type { 
//   ChatMessageOutgoing, 
  ChatMessageIncoming, 
//   ChatClientMessage, 
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

                case ChatEvents.GAME_INVITE: {
                    setMessages(prevMessages => [...prevMessages, packet.data]);
                    break;
                }
                case ChatEvents.GAME_INVITE_REPLY: {
                    setMessages((prev) => {
                        const index = prev.findIndex((msg) => msg.id === packet.data.id);
                        if (index !== -1) {
                            // Replace existing message by id
                            const updated = [...prev];
                            updated[index] = packet.data;
                            return updated;
                        }
                        // Otherwise add it
                        return [...prev, packet.data];
                    });
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







    function sendPacket(packet: any) {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(packet));
        }
    }


    function sendMessage(receiver_id: number, content: string){
        sendPacket({
            event: ChatEvents.MESSAGE,
            data: { receiver_id, content}
        });
    }


    function sendTyping(receiverId: number) {
        sendPacket({
            event: ChatEvents.TYPING,
            data: { receiver_id: receiverId }
        });
    }

    function sendRead(senderId: number){
        sendPacket({
            event: ChatEvents.READ,
            data: { sender_id: senderId }
        });
    }

    function sendInvite(receiverId: number) {
        sendPacket({
            event: ChatEvents.GAME_INVITE,
            data: { receiver_id: receiverId }
        });
    }

    function sendInviteReply(messageId: number, accept: boolean) {
        sendPacket({
            event: ChatEvents.GAME_INVITE_REPLY,
            data: { message_id: messageId, accept: accept }
        });
    }


    return { isConnected, messages, presence,
         sendMessage, typing, sendTyping, sendRead,readAt, sendInvite, sendInviteReply };
}