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

export default function Chat() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { isConnected, messages, sendMessage } = useChatSocket(
    user && token ? `wss://localhost/api/chat/ws?token=${token}` : '',
    user ? Number(user.id) : 0
  );
  const [selectedFriend, setSelectedFriend] = useState(MOCK_FRIENDS[0]);
  const [draft, setDraft] = useState('');

  const userReady = Boolean(user && token);

  const { historyMessages, historyLoading, historyError } = useChatHistory(
    selectedFriend.id,
    token,
    userReady
  );
  const { blockStatus, handleToggleBlock } = useBlockStatus(selectedFriend.id, token, userReady);

  // ref to the always-empty div at the end of the message list, so we can
  // scroll it into view whenever a new message arrives instead of leaving
  // the user stuck wherever they were scrolled to.
  const messagesEndRef = useRef<HTMLDivElement>(null!);

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) navigate(path);
  };

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(selectedFriend.id, draft.trim());
    setDraft('');
  };

  // MOCK_FRIENDS' hardcoded ids (1, 2, 3) can collide with a real logged-in
  // user's id, which would otherwise let you select "yourself" as a friend
  // and message yourself. Filter your own id out of the list shown in the
  // sidebar. Runs after the !user early-return below via the effect
  // further down, and is computed here for the render itself.
  const visibleFriends = user ? MOCK_FRIENDS.filter((friend) => friend.id !== Number(user.id)) : MOCK_FRIENDS;

  // If the default/current selection happens to be yourself (because
  // MOCK_FRIENDS[0] or a previous selection matches your real id), fall
  // back to the first non-you friend as soon as we know who "you" are.
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

  // ONLINE only when the selected friend's status says so AND the chat
  // socket is actually connected — nothing hardcoded.
  const isFriendOnline = selectedFriend.status === 'online' && isConnected;

  // History comes from REST (past messages), messages comes from the WS
  // hook (live ones sent/received after page load). Merge and dedupe by id
  // so a message that arrives live isn't shown twice if it's also present
  // in a refetched history.
  const liveForFriend = messages.filter(
    (message) => message.sender_id === selectedFriend.id || message.receiver_id === selectedFriend.id
  );

  const conversation = [...historyMessages, ...liveForFriend].filter(
    (message, index, all) => all.findIndex((m) => m.id === message.id) === index
  );

  // true when either side has blocked the other — used to disable input/send.
  const isBlockedEitherWay = blockStatus.iBlockedThem || blockStatus.theyBlockedMe;

  // Fires whenever the visible conversation grows (new message sent or
  // received, or friend switched) and jumps the list to the bottom.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, selectedFriend.id]);

  return (
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={handleSelectTab} />

      <main className="flex-1 min-h-0 h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] max-w-[1320px] mx-auto w-full px-4 py-5 flex gap-5 overflow-hidden">
        <FriendsSidebar friends={visibleFriends} selectedFriend={selectedFriend} onSelectFriend={setSelectedFriend} />

        <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#050B1E] border-2 border-pacova-green-dark rounded-lg overflow-hidden">
          <ConversationHeader
            friend={selectedFriend}
            isFriendOnline={isFriendOnline}
            blockStatus={blockStatus}
            onToggleBlock={handleToggleBlock}
          />

          <MessageList
            conversation={conversation}
            selectedFriend={selectedFriend}
            currentUserId={user.id}
            historyLoading={historyLoading}
            historyError={historyError}
            messagesEndRef={messagesEndRef}
          />

          <MessageInput draft={draft} onDraftChange={setDraft} onSend={handleSend} disabled={isBlockedEitherWay} />
        </section>
      </main>
    </Background>
  );
}