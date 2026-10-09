// A React component is just a function that returns JSX (HTML-like code).
// "export default" lets other files import it with any name.
import { MOCK_FRIENDS } from './constants';
import FriendsSidebar from './FriendsSidebar';
import type { Friend } from './types';
import { useState } from 'react';
// import { formatMessageTimestamp } from './formatTimestamp'
import { useAuth } from '../../context/AuthContext';






export default function Chatt() {
  const { user, token } = useAuth();
  const currentUserId = (user ? Number(user.id) : 0);
  const visibleFriends = MOCK_FRIENDS.filter((friend) => friend.id !== currentUserId);


  const [selectedFriend, setSelectedFriend] = useState(visibleFriends[0]);

  if(!user || !token)
      return <p>Loading...</p>;

  function handleSelectFriend(friend: Friend)
  {
    setSelectedFriend(friend);
  }


  return ( 
    <div>
      <FriendsSidebar friends={visibleFriends} onSelectFriend={handleSelectFriend} selectedFriend={selectedFriend}/>
      <p>Chatting with:{selectedFriend.username}</p>
      
    </div>
  )
}