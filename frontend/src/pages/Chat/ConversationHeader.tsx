import { useEffect, useRef, useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import PixelButton from '../../components/ui/PixelButton';
import PacManIcon from './PacManIcon';
import { NO_GLOW } from './constants';
import type { Friend, BlockStatus } from './types';

interface ConversationHeaderProps {
  friend: Friend;
  isFriendOnline: boolean;
  blockStatus: BlockStatus;
  onToggleBlock: () => void;
  onInviteClick: () => void;
  inviteDisabled: boolean;
}

// Which confirm panel (if any) the menu is currently showing instead of the
// option list — 'block' for block/unblock
type ConfirmMode = 'block' | null;

export default function ConversationHeader({
  friend,
  isFriendOnline,
  blockStatus,
  onToggleBlock,
  onInviteClick,
  inviteDisabled,
}: ConversationHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setMenuOpen(false);
    setConfirmMode(null);
  };

  // Close on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenu();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Friend switched while the menu was open — close it rather than leave a
  // stale menu open over a new conversation.
  useEffect(() => {
    closeMenu();
  }, [friend.id]);

  const handleConfirmBlock = () => {
    onToggleBlock();
    closeMenu();
  };

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 h-20 border-b-2 border-pacova-green-dark relative">
      <div className="flex items-center gap-3 min-w-0">
        <span className="rounded-full overflow-hidden ring-2 ring-pacova-green-dark/60 shrink-0">
          <Avatar iconName={friend.icon} size="sm" />
        </span>
        <div className="min-w-0">
          <span className="font-pixelify text-white text-lg uppercase block truncate">
            {friend.username}
          </span>
          <span
            className={`font-vt323 text-base uppercase tracking-wide ${
              isFriendOnline ? 'text-pacova-green' : 'text-gray-500'
            }`}
          >
            {isFriendOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onInviteClick}
        disabled={inviteDisabled}
        className={`justify-self-center flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-amber-400/70 bg-black/60 font-pixelify text-amber-300 text-sm uppercase tracking-wide shadow-[0_0_10px_rgba(245,158,11,0.5)] hover:brightness-125 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${NO_GLOW ? '' : ''}`}
      >
        <PacManIcon className="w-5 h-5" />
        Invite to Play
      </button>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="Chat options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className={`p-2 rounded-md text-pacova-green hover:bg-pacova-green/10 transition-colors ${NO_GLOW}`}
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-64 bg-pacova-surface border-2 border-pacova-green-dark rounded-lg z-20 overflow-hidden"
          >
            {confirmMode === 'block' && (
              <div className="relative p-4 flex flex-col items-center gap-3">
                <p className="font-vt323 text-white text-lg text-center uppercase">
                  {blockStatus.iBlockedThem ? 'Unblock this user?' : 'Block this user?'}
                </p>
                <div className="flex gap-3">
                  <PixelButton variant="danger-red" size="sm" onClick={handleConfirmBlock}>
                    Yes
                  </PixelButton>
                  <PixelButton variant="outline-green" size="sm" onClick={() => setConfirmMode(null)}>
                    No
                  </PixelButton>
                </div>
              </div>
            )}

            {confirmMode === null && (
              <ul className="relative py-1">
                {/* Profile lookup needs user_db, which doesn't exist yet —
                    kept visible but disabled instead of just missing. */}
                <li>
                  <button
                    type="button"
                    disabled
                    className="w-full text-left px-4 py-2 font-vt323 text-xl uppercase text-gray-500 cursor-not-allowed flex items-center justify-between"
                  >
                    View Profile
                    <span className="text-sm normal-case">Soon</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setConfirmMode('block')}
                    className="w-full text-left px-4 py-2 font-vt323 text-xl uppercase text-red-500 hover:bg-red-500/10"
                  >
                    {blockStatus.iBlockedThem ? 'Unblock User' : 'Block User'}
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}