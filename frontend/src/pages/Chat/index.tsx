import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChatSocket } from '../../hooks/useChatSocket';
import Background from '../../components/ui/Background';
import Navbar from '../../components/ui/Navbar';

import { MOCK_FRIENDS, routeMap } from './constants';
import { useChatHistory } from './useChatHistory';
import { useBlockStatus } from './useBlockStatus';
import FriendsSidebar from './FriendsSidebar';
import ConversationHeader from './ConversationHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import NewChatModal from './NewChatModal';
import Toast from '../../components/ui/Toast';
import type { Friend } from './types';




export default function Chat() {
  // 1. Hooks & Global Authentication Context
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { messages, sendMessage, presence } = useChatSocket(
    user && token ? `wss://${window.location.host}/api/chat/ws?token=${token}` : '',
    user ? Number(user.id) : 0
  );


  // 2. Component State Management
  const [selectedFriend, setSelectedFriend] = useState(MOCK_FRIENDS[0]);
  const [draft, setDraft] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);



  // 3. Unread Messages & Last-Seen Divider (useRef)
  const lastSeenRef = useRef<Record<number, string>>({});
  const [dividerCutoff, setDividerCutoff] = useState<string | null>(null);

  const userReady = Boolean(user && token);


  // Effect 1: Restoring Preferences from localStorage
  useEffect(() => {
    if (!user) return;
    try {
      const rawSeen = localStorage.getItem(`pacova-lastseen-${user.id}`);
      lastSeenRef.current = rawSeen ? JSON.parse(rawSeen) : {};
    } catch (err) {
      console.warn('[CHAT] Failed to load last-seen map from storage:', err);
      lastSeenRef.current = {};
    }
    setDividerCutoff(lastSeenRef.current[selectedFriend.id] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);



  // Effect 2: Cleanup Function on Conversation Leave
  // ADDED: whenever you leave a friend mark that conversation as "seen right now" 
  useEffect(() => {
    const friendId = selectedFriend.id;
    return () => {
      if (!user) return;
      lastSeenRef.current[friendId] = new Date().toISOString();
      try {
        localStorage.setItem(`pacova-lastseen-${user.id}`, JSON.stringify(lastSeenRef.current));
      } catch (err) {
        console.warn('[CHAT] Failed to persist last-seen map:', err);
      }
    };
  }, [selectedFriend.id, user?.id]);

  const { historyMessages, historyLoading, historyError } = useChatHistory(
    selectedFriend.id,
    token,
    userReady
  );
  const { blockStatus, handleToggleBlock } = useBlockStatus(selectedFriend.id, token, userReady);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) navigate(path);
  };

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(selectedFriend.id, draft.trim());
    setDraft('');
  };

  // CHANGED: was a plain setSelectedFriend — now also captures the divider
  // cutoff for the friend being opened BEFORE the leave-effect above
  // overwrites it with "now".
  const handleSelectFriend = (friend: Friend) => {
    setDividerCutoff(lastSeenRef.current[friend.id] ?? null);
    setSelectedFriend(friend);
  };

 

  

  const visibleFriends = user ? MOCK_FRIENDS.filter((friend) => friend.id !== Number(user.id)) : MOCK_FRIENDS;

  const visibleFriendsLive = visibleFriends.map((friend) => ({
    ...friend,
    status: presence[friend.id] ?? friend.status,
  }));

  useEffect(() => {
    if (user && selectedFriend.id === Number(user.id)) {
      const fallback = MOCK_FRIENDS.find((friend) => friend.id !== Number(user.id));
      if (fallback) setSelectedFriend(fallback);
    }
  }, [user?.id]);

  if (!user || !token) {
    return (
      <Background>
        <Navbar activeTab="CHAT" onSelectTab={handleSelectTab} />
        <main className="flex-1 flex items-center justify-center">
          <h1 className="font-pixelify text-pacova-pink text-3xl uppercase">Loading...</h1>
        </main>
      </Background>
    );
  }

  const selectedFriendLive = { ...selectedFriend, status: presence[selectedFriend.id] ?? selectedFriend.status };
  const isFriendOnline = selectedFriendLive.status === 'online';


  // 2. Merging & Deduplicating Conversation Messages
  const liveForFriend = messages.filter(
    (message) => message.sender_id === selectedFriend.id || message.receiver_id === selectedFriend.id
  );
  let conversation = [...historyMessages, ...liveForFriend].filter(
    (message, index, all) => all.findIndex((m) => m.id === message.id) === index
  );



  const isBlockedEitherWay = blockStatus.iBlockedThem || blockStatus.theyBlockedMe;
  // const isMutedSelected = mutedIds.has(selectedFriend.id);


  // 3. Auto-Scrolling to Bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, selectedFriend.id]);

  return (
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={handleSelectTab} />

      <main className="flex-1 min-h-0 h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] max-w-[1320px] mx-auto w-full px-4 py-5 flex gap-5 overflow-hidden">
        <FriendsSidebar
          friends={visibleFriendsLive}
          selectedFriend={selectedFriendLive}
          onSelectFriend={handleSelectFriend}
          onNewChat={() => setIsNewChatOpen(true)}
        />

        <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-pacova-surface border-2 border-pacova-green-dark rounded-lg overflow-hidden">
          <ConversationHeader
            friend={selectedFriendLive}
            isFriendOnline={isFriendOnline}
            blockStatus={blockStatus}
            onToggleBlock={handleToggleBlock}
          />

          <MessageList
            conversation={conversation}
            selectedFriend={selectedFriendLive}
            currentUserId={user.id}
            historyLoading={historyLoading}
            historyError={historyError}
            messagesEndRef={messagesEndRef}
            dividerCutoff={dividerCutoff}
          />

          <MessageInput draft={draft} onDraftChange={setDraft} onSend={handleSend} disabled={isBlockedEitherWay} />
        </section>
      </main>

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        friends={visibleFriendsLive}
        onSelectFriend={handleSelectFriend}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Background>
  );
}