import { Avatar } from '../../components/ui/Avatar';
import { NO_GLOW } from './constants';
import type { Friend, BlockStatus } from './types';

interface ConversationHeaderProps {
  friend: Friend;
  isFriendOnline: boolean;
  blockStatus: BlockStatus;
  onToggleBlock: () => void;
}

export default function ConversationHeader({
  friend,
  isFriendOnline,
  blockStatus,
  onToggleBlock,
}: ConversationHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 h-20 border-b-2 border-pacova-green-dark">
      <div className="flex items-center gap-3 min-w-0">
        <span className="rounded-full overflow-hidden ring-2 ring-pacova-green-dark/60 shrink-0">
          <Avatar iconName={friend.icon} size="sm" status={friend.status} />
        </span>
        <div className="min-w-0">
          <span className="font-pixelify text-white text-lg uppercase block truncate">
            {friend.username}
          </span>
          <span
            className={`font-vt323 text-base uppercase tracking-wide ${
              isFriendOnline ? 'text-pacova-green' : 'text-red-500'
            }`}
          >
            {isFriendOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      {/* CHANGED: options button now toggles block/unblock for the
          selected friend, and its color reflects current block state. */}
      <button
        type="button"
        aria-label={blockStatus.iBlockedThem ? 'Unblock user' : 'Block user'}
        onClick={onToggleBlock}
        className={`p-2 rounded-md transition-colors ${NO_GLOW} ${
          blockStatus.iBlockedThem ? 'text-red-500 hover:bg-red-500/10' : 'text-pacova-green hover:bg-pacova-green/10'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
    </div>
  );
}