import { useEffect, useRef, useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import PixelButton from '../../components/ui/PixelButton';
import { NO_GLOW } from './constants';
import type { Friend, BlockStatus } from './types';

interface ConversationHeaderProps {
  friend: Friend;
  isFriendOnline: boolean;
  blockStatus: BlockStatus;
  onToggleBlock: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onClearConversation: () => void;
}

export default function ConversationHeader({
  friend,
  isFriendOnline,
  blockStatus,
  onToggleBlock,
  isMuted,
  onToggleMute,
  onClearConversation,
}: ConversationHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  // When true, the menu shows a Y/N confirm instead of the option list —
  // blocking now lives inside the menu, so it needs its own "are you sure"
  // step instead of firing instantly on a single click like before.
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setMenuOpen(false);
    setConfirmingBlock(false);
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

  // Friend switched while the menu was open (e.g. a sidebar click behind
  // it) — close it rather than leave a stale menu open over a new
  // conversation.
  useEffect(() => {
    closeMenu();
  }, [friend.id]);

  const handleConfirmBlock = () => {
    onToggleBlock();
    closeMenu();
  };

  return (
    <div className="flex items-center justify-between gap-3 px-5 h-20 border-b-2 border-pacova-green-dark relative">
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
            className="absolute right-0 top-full mt-2 w-56 bg-pacova-surface border-2 border-pacova-green-dark pixel-corners-3step shadow-neon-green z-20 overflow-hidden"
          >
            <span className="absolute inset-0 pixel-scanlines pointer-events-none" />

            {confirmingBlock ? (
              <div className="relative p-4 flex flex-col items-center gap-3">
                <p className="font-vt323 text-white text-lg text-center uppercase">
                  {blockStatus.iBlockedThem ? 'Unblock this user?' : 'Block this user?'}
                </p>
                <div className="flex gap-3">
                  <PixelButton variant="danger-red" size="sm" onClick={handleConfirmBlock}>
                    Yes
                  </PixelButton>
                  <PixelButton variant="outline-green" size="sm" onClick={() => setConfirmingBlock(false)}>
                    No
                  </PixelButton>
                </div>
              </div>
            ) : (
              <ul className="relative py-1">
                {/* Profile lookup needs user_db, which doesn't exist yet —
                    kept visible but disabled instead of just missing. */}
                <li>
                  <button
                    type="button"
                    disabled
                    className="w-full text-left px-4 py-2 font-vt323 text-base uppercase text-gray-500 cursor-not-allowed flex items-center justify-between"
                  >
                    View Profile
                    <span className="text-xs normal-case">Soon</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onToggleMute();
                      closeMenu();
                    }}
                    className="w-full text-left px-4 py-2 font-vt323 text-base uppercase text-pacova-green hover:bg-pacova-green/10"
                  >
                    {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onClearConversation();
                      closeMenu();
                    }}
                    className="w-full text-left px-4 py-2 font-vt323 text-base uppercase text-pacova-green hover:bg-pacova-green/10"
                  >
                    Clear Conversation
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setConfirmingBlock(true)}
                    className="w-full text-left px-4 py-2 font-vt323 text-base uppercase text-red-500 hover:bg-red-500/10"
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