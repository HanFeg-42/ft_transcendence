import type { Friend } from './types';


interface FriendsSidebarProps {
  friends: Friend[];
  onSelectFriend: (friend: Friend) => void;
  selectedFriend: Friend;
}

export default function FriendsSidebar({friends, onSelectFriend, selectedFriend} : FriendsSidebarProps) {
  return (
  <ul className="bg-pacova-purple text-pacova-pink font-vt323 p-4">
    {friends.map((friend) => (
      <li key={friend.id} onClick={() => {onSelectFriend(friend)}}
      className={`flex items-center gap-2 border-1 px-3 py-3 rounded-md 
        ${friend.id === selectedFriend.id ? "border-pacova-green" : "border-pacova-gray"}`}
      >
        <span className={`w-3 h-3 rounded-full 
          ${friend.status === "online" ? "bg-pacova-green" : "bg-red-500"}`}/>
        <span className="bg-pacova-purple text-pacova-pink font-vt323 p-4" >{friend.username} - {friend.status}</span>
      </li>
    ))}
  </ul>
  );
}