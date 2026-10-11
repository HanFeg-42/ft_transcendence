import { useRef, useState, useEffect  } from 'react';
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
            }
        }

        


        return () => {ws.close();};
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

    return { isConnected, messages, presence, sendMessage };
}