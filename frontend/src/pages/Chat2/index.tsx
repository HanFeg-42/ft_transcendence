// A React component is just a function that returns JSX (HTML-like code).
// "export default" lets other files import it with any name.
import { MOCK_FRIENDS, routeMap } from './constants';
import FriendsSidebar from './FriendsSidebar';
import type { Friend } from './types';
import { useState } from 'react';
// import { formatMessageTimestamp } from './formatTimestamp'
import { useAuth } from '../../context/AuthContext';
import useChatHistory from './useChatHistory';
import MessageList from './MessageList';
import Background from '../../components/ui/Background';
import Navbar from '../../components/ui/Navbar';
import { useNavigate } from 'react-router-dom';
import useChatSocket from './useChatSocket';
import MessageInput from './MessageInput';




export default function Chatt() {
  const { user, token } = useAuth();
  const currentUserId = (user ? Number(user.id) : 0);
  const visibleFriends = MOCK_FRIENDS.filter((friend) => friend.id !== currentUserId);

  const navigate = useNavigate();
  const [selectedFriend, setSelectedFriend] = useState(visibleFriends[0]);
  const { historyMessages, historyLoading, historyError } = useChatHistory(selectedFriend.id, token);
  const url = token ? `wss://${window.location.host}/api/chat/ws?token=${token}` : '';
  const {  sendMessage } = useChatSocket(url);
  const [draft, setDraft] = useState('');

  if(!user || !token)
      return <p>Loading...</p>;

  function handleSelectFriend(friend: Friend)
  {
    setSelectedFriend(friend);
  }
  function handleSelectTab(tab: string)
  {
    if(routeMap[tab])
      navigate(routeMap[tab]);
  }

  function handleSend() {
    if (!draft.trim()) return;
    sendMessage(selectedFriend.id, draft.trim());
    setDraft('');
  }

  return ( 
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={handleSelectTab}></Navbar>
      <main className='flex gap-5 px-4 py-5 h-[calc(100vh-80px)]'>
        <FriendsSidebar friends={visibleFriends} onSelectFriend={handleSelectFriend} selectedFriend={selectedFriend}/>
        <section className='flex-1 min-w-0 flex flex-col'>
          <MessageList conversation={historyMessages} selectedFriend={selectedFriend}
          currentUserId={currentUserId} loading={historyLoading} error={historyError}/>
          <MessageInput draft={draft} onDraftChange={setDraft} onSend={handleSend} disabled={false}/>
        </section>
      </main>
      
    </Background>
  )
}