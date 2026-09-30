import { useEffect, useState } from 'react';
import type { BlockStatus } from './types';

// Loads block status (both directions) for the selected friend, and
// exposes a toggle to block/unblock them.
export function useBlockStatus(friendId: number, token: string | null, userReady: boolean) {
  const [blockStatus, setBlockStatus] = useState<BlockStatus>({
    iBlockedThem: false,
    theyBlockedMe: false,
  });

  useEffect(() => {
    if (!userReady || !token) return;

    fetch(`/api/chat/blocks/status/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setBlockStatus(data))
      .catch((err) => console.error('[CHAT] Failed to load block status:', err));
  }, [friendId, token, userReady]);

  const handleToggleBlock = () => {
    if (!token) return;
    const method = blockStatus.iBlockedThem ? 'DELETE' : 'POST';

    fetch(`/api/chat/blocks/${friendId}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => setBlockStatus((prev) => ({ ...prev, iBlockedThem: !prev.iBlockedThem })))
      .catch((err) => console.error('[CHAT] Failed to toggle block:', err));
  };

  return { blockStatus, handleToggleBlock };
}