import type { Friend } from './types';


interface FriendsSidebarProps {
  friends: Friend[];
  onSelectFriend: (friend: Friend) => void;
}

export default function FriendsSidebar({friends, onSelectFriend} : FriendsSidebarProps) {
  return (
  <ul>
    {friends.map((friend) => (
      <li key={friend.id} onClick={() => {onSelectFriend(friend)}}>
        {friend.username} - {friend.status}
      </li>
    ))}
  </ul>
  );
}