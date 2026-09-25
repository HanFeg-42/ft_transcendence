import { useMemo, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import type { Friend } from './types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  onSelectFriend: (friend: Friend) => void;
}

// NOTE: there's no real user-search endpoint yet (needs a small public
// lookup on the auth service, or user_db once that's built) — for now this
// only lets you jump to someone already in your friends list. Swap the
// `friends` prop for a real search-result list once that endpoint exists;
// nothing else in this component needs to change.
export default function NewChatModal({ isOpen, onClose, friends, onSelectFriend }: NewChatModalProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((friend) => friend.username.toLowerCase().includes(q));
  }, [friends, query]);

  const handlePick = (friend: Friend) => {
    onSelectFriend(friend);
    setQuery('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Chat">
      <div className="flex flex-col gap-4">
        <input
          type="text"
          autoFocus
          placeholder="Search username..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-black/60 border border-gray-700 focus:border-pacova-pink text-white font-vt323 text-lg px-3 py-2 rounded-md outline-none"
        />

        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
          {results.length === 0 && (
            <p className="font-vt323 text-gray-500 text-lg text-center py-6">No matches.</p>
          )}
          {results.map((friend) => (
            <button
              key={friend.id}
              type="button"
              onClick={() => handlePick(friend)}
              className="flex items-center gap-3 px-3 py-2 rounded-md border-2 border-transparent hover:border-pacova-pink transition-colors text-left"
            >
              <Avatar iconName={friend.icon} size="sm" status={friend.status} />
              <span className="font-vt323 text-white text-lg uppercase truncate">{friend.username}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}