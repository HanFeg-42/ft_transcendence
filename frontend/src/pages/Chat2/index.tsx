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
import useBlockStatus from './useBlockStatus';
import NewChatModal from './NewChatModal';








export default function Chatt() {
  const { user, token } = useAuth();
  const currentUserId = (user ? Number(user.id) : 0);
  const visibleFriends = MOCK_FRIENDS.filter((friend) => friend.id !== currentUserId);

  const navigate = useNavigate();
  const [selectedFriend, setSelectedFriend] = useState(visibleFriends[0]);
  const { historyMessages, historyLoading, historyError } = useChatHistory(selectedFriend.id, token);
  const url = token ? `wss://${window.location.host}/api/chat/ws?token=${token}` : '';
  const { messages, presence, sendMessage,
     typing, sendTyping, sendRead, readAt } = useChatSocket(url);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);// empty flag pin
  const { iBlockedThem, theyBlockedMe, toggleBlock } = useBlockStatus(selectedFriend?.id, token);
  const isBlocked = iBlockedThem || theyBlockedMe;
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const lastTypingSentRef = useRef<Record<number, number>>({});



  //merge old and live messages
  const liveForFriend = messages.filter((msg) => {
    return (msg.sender_id === selectedFriend.id || msg.receiver_id === selectedFriend.id)
  });
  const conversation = [...historyMessages, ...liveForFriend].filter(
    (message, index, all) => all.findIndex((m) => m.id === message.id) === index
  ); 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, selectedFriend.id, historyLoading, typing[selectedFriend.id]])


  // READ Effect 1: Fires when conversation length changes or active friend changes
  useEffect(() => {
    if (document.visibilityState === 'visible' && selectedFriend?.id) {
      sendRead(selectedFriend.id);
    }
  }, [conversation.length, selectedFriend?.id]);
  // Effect 2: Fires when the user tabs back into the window/browser
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && selectedFriend?.id) {
        sendRead(selectedFriend.id);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedFriend?.id]);




  if(!user || !token){
      return (
        <Background>
          <Navbar activeTab="CHAT" onSelectTab={handleSelectTab} />
          <main className="flex-1 flex items-center justify-center">
            <h1 className="font-pixelify text-pacova-pink text-3xl uppercase">Loading...</h1>
          </main>
        </Background>
      );
    }

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

  function handleDraftChange(value: string) {
      setDraft(value);

      if (value.trim() !== "") {
        const now = Date.now();
        const lastSent = lastTypingSentRef.current[selectedFriend.id] || 0;
      
        // Throttle: check if more than 2000ms (2 seconds) have passed
        if (now - lastSent > 2000) {
          sendTyping(selectedFriend.id);
          lastTypingSentRef.current[selectedFriend.id] = now;
        }
      }
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

      <main className="flex-1 min-h-0 h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] max-w-[1320px] mx-auto w-full px-4 py-5 flex gap-5 overflow-hidden">
        <FriendsSidebar 
        friends={visibleFriendsLive} 
        onSelectFriend={handleSelectFriend} 
        selectedFriend={selectedFriend}
        onNewChat={() => setIsNewChatOpen(true)}
        />


        <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-pacova-surface border-2 border-pacova-green-dark rounded-lg overflow-hidden">
          <ConversationHeader 
          friend={selectedFriendLive}
          iBlockedThem={iBlockedThem} 
          toggleBlock={toggleBlock}
          />

          <MessageList 
          conversation={conversation} 
          selectedFriend={selectedFriend}
          currentUserId={currentUserId} 
          loading={historyLoading} 
          error={historyError} 
          messagesEndRef={messagesEndRef}
          isTyping={typing[selectedFriend.id] ?? false}
          friendReadAt={readAt[selectedFriend.id] ?? null}
          />

          <MessageInput 
          draft={draft} 
          onDraftChange={handleDraftChange}
          onSend={handleSend} 
          disabled={isBlocked}/>
        </section>
      </main>
      
      <NewChatModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
        friends={visibleFriendsLive} 
        onSelectFriend={(friend) => {
          setSelectedFriend(friend);
        }} 
        />

    </Background>
  )
}