// A React component is just a function that returns JSX (HTML-like code).
// "export default" lets other files import it with any name.
import { MOCK_FRIENDS } from './constants';
import FriendsSidebar from './FriendsSidebar';
// import type { Friend } from './types';
import { useState } from 'react';



export default function Chatt() {

  const [selectedFriend, setSelectedFriend] = useState(MOCK_FRIENDS[0]);

  return (
    <div>
      <FriendsSidebar friends={MOCK_FRIENDS} />
      <p>Chatting with:{selectedFriend.username}</p>
    </div>
  )
}