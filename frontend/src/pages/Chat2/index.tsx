// A React component is just a function that returns JSX (HTML-like code).
// "export default" lets other files import it with any name.
import { MOCK_FRIENDS, routeMap } from './constants';
import FriendsSidebar from './FriendsSidebar';
import type { Friend } from './types';
import { useState, useRef, useEffect } from 'react';
// import { formatMessageTimestamp } from './formatTimestamp'
import { useAuth } from '../../context/AuthContext';
import useChatHistory from './useChatHistory';
import MessageList from './MessageList';
import Background from '../../components/ui/Background';
import Navbar from '../../components/ui/Navbar';
import { useNavigate } from 'react-router-dom';
import useChatSocket from './useChatSocket';
import MessageInput from './MessageInput';
import ConversationHeader from './ConversationHeader';



export default function Chatt() {
  const { user, token } = useAuth();
  const currentUserId = (user ? Number(user.id) : 0);
  const visibleFriends = MOCK_FRIENDS.filter((friend) => friend.id !== currentUserId);

  const navigate = useNavigate();
  const [selectedFriend, setSelectedFriend] = useState(visibleFriends[0]);
  const { historyMessages, historyLoading, historyError } = useChatHistory(selectedFriend.id, token);
  const url = token ? `wss://${window.location.host}/api/chat/ws?token=${token}` : '';
  const { messages, presence, sendMessage } = useChatSocket(url);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);// empty flag pin

  //merge old and live messages
  const liveForFriend = messages.filter((msg) => {
    return (msg.sender_id === selectedFriend.id || msg.receiver_id === selectedFriend.id)
  });
  const conversation = [...historyMessages, ...liveForFriend].filter(
    (message, index, all) => all.findIndex((m) => m.id === message.id) === index
  ); 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, selectedFriend.id, historyLoading])



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
  //array containing all of friends for the sidebar list
  const visibleFriendsLive = visibleFriends.map((friend) => ({
    ...friend, // Copy all existing friend properties (name, avatar, etc.)
    status: presence[friend.id] ?? friend.status // Override status if live data exists
  }));
  //single object representing just the one person currently chatting with.
  const selectedFriendLive = { 
    ...selectedFriend, 
    status: presence[selectedFriend.id] ?? selectedFriend.status 
  };

  return ( 
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={handleSelectTab}></Navbar>
      <main className='flex gap-5 px-4 py-5 h-[calc(100vh-80px)]'>
        <FriendsSidebar friends={visibleFriendsLive} onSelectFriend={handleSelectFriend} selectedFriend={selectedFriend}/>
        <section className='flex-1 min-w-0 flex flex-col'>
          <ConversationHeader friend={selectedFriendLive} />
          <MessageList conversation={conversation} selectedFriend={selectedFriend}
          currentUserId={currentUserId} loading={historyLoading} error={historyError} messagesEndRef={messagesEndRef}/>
          <MessageInput draft={draft} onDraftChange={setDraft} onSend={handleSend} disabled={false}/>
        </section>
      </main>
      
    </Background>
  )
}