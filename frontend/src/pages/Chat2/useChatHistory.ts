import { useState, useEffect } from "react";
import type { Message } from "./types";



export default function useChatHistory(friendId: number, token: string | null) 
{
    const [historyMessages, setHistoryMessages] = useState<Message[]>([]);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        setHistoryLoading(true);
        setHistoryError(null);//clear out any old errors from previous

        fetch(`/api/chat/messages/${friendId}`, {
        headers: {'Authorization': `Bearer ${token}`}})
        .then(response => {
            if(!response.ok)
                throw new Error('Could not load message history.');
            return response.json();
        })
        .then(data => {
            if (cancelled) return;
            setHistoryMessages([...data].reverse());
        })
        .catch(error => {
            if (cancelled) return;
            setHistoryError(error.message);
        })
        .finally(() => {
            if (cancelled) return;
            setHistoryLoading(false);
        });
        

        return () => { cancelled = true; };

    }, [friendId, token])

    return { historyMessages, historyLoading, historyError };
}