import { useEffect, useState } from 'react';
import type { HistoryMessage } from './types';

// Fetches chat history for the selected friend whenever it changes, and
// tracks loading/error state for it.
export function useChatHistory(friendId: number, token: string | null, userReady: boolean) {
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!userReady || !token) return;

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);

    fetch(`/api/chat/messages/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json() as Promise<HistoryMessage[]>;
      })
      .then((data) => {
        if (cancelled) return;
        // API returns newest-first (for pagination); display wants oldest-first
        setHistoryMessages([...data].reverse());
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[CHAT] Failed to load history:', err);
        setHistoryError('Could not load message history.');
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [friendId, token, userReady]);

  return { historyMessages, historyLoading, historyError };
}