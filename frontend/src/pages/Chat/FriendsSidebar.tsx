import { Avatar } from '../../components/ui/Avatar';
import PixelButton from '../../components/ui/PixelButton';
import PacManIcon from './PacManIcon';
import { NO_GLOW } from './constants';
import type { Friend } from './types';

interface FriendsSidebarProps {
  friends: Friend[];
  selectedFriend: Friend;
  onSelectFriend: (friend: Friend) => void;
}

export default function FriendsSidebar({ friends, selectedFriend, onSelectFriend }: FriendsSidebarProps) {
  return (
    <div className="w-[22rem] shrink-0 min-h-0 flex flex-col bg-[#050B1E] border-2 border-pacova-green-dark rounded-lg overflow-hidden">
      <h2 className="font-pixelify text-pacova-green text-2xl uppercase tracking-wider text-center px-5 h-20 flex items-center justify-center gap-4 border-b-2 border-pacova-green-dark">
        <PacManIcon className="w-7 h-7 shrink-0" />
        Friends
        <PacManIcon className="w-7 h-7 shrink-0" flip />
      </h2>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0 p-4">
        {friends.map((friend) => {
          const isSelected = friend.id === selectedFriend.id;
          return (
            <button
              key={friend.id}
              onClick={() => onSelectFriend(friend)}
              className={`flex items-center gap-3 px-3 py-3 rounded-md border-2 transition-colors text-left ${NO_GLOW} ${
                isSelected
                  ? friend.status === 'offline'
                    ? 'border-red-500'
                    : 'border-pacova-green'
                  : 'border-transparent hover:border-pacova-gray'
              }`}
            >
              <span className="rounded-full overflow-hidden ring-2 ring-pacova-green-dark/60 shrink-0">
                <Avatar iconName={friend.icon} size="sm" status={friend.status} />
              </span>
              <span className="font-vt323 text-white text-lg uppercase truncate flex-1">
                {friend.username}
              </span>
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  friend.status === 'online'
                    ? 'bg-pacova-green'
                    : friend.status === 'busy'
                      ? 'bg-pacova-pink-dark'
                      : 'bg-red-500'
                }`}
                aria-label={friend.status}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-auto h-[76px] px-4 flex items-center border-t-2 border-pacova-green-dark">
        {/* CHANGED: size bumped from "sm" to "lg" — her new sizeStyles
            made "sm" only 32px tall, too small. */}
        <PixelButton
          type="button"
          variant="outline-green"
          size="lg"
          className={`w-full ${NO_GLOW}`}
          onClick={() => undefined}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
              <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5.2l-2.8 3-2.8-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 4v2h2V8H6Zm5 0v2h2V8h-2Zm5 0v2h2V8h-2Z" />
            </svg>
            New Chat
          </span>
        </PixelButton>
      </div>
    </div>
  );
}