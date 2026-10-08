import type { Friend } from './types';


interface FriendsSidebarProps {
  friends: Friend[];
}

export default function FriendsSidebar({friends} : FriendsSidebarProps) {
  return (
  <ul>
    {friends.map((friend) => (
      <li key={friend.id}>
        {friend.username} - {friend.status}
      </li>
    ))}
  </ul>
  );
}