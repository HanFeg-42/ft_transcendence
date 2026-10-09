import { useState } from "react";
import type { Message } from "./types";



export function useChatHistory(friendId: number, token: string | null) 
{
    const [historyMessages, setHistoryMessages] = useState<Message[]>([]);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

}