import { Avatar } from '../../components/ui/Avatar';
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
    <div className="w-[22rem] shrink-0 min-h-0 flex flex-col bg-pacova-surface border-2 border-pacova-green-dark rounded-lg overflow-hidden">
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
                    ? 'border-gray-500'
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
                      : 'bg-gray-500'
                }`}
                aria-label={friend.status}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}