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

export default function Chat() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { messages, sendMessage, presence } = useChatSocket(
    user && token ? `wss://localhost/api/chat/ws?token=${token}` : '',
    user ? Number(user.id) : 0
  );
  const [selectedFriend, setSelectedFriend] = useState(MOCK_FRIENDS[0]);
  const [draft, setDraft] = useState('');

  // ADDED: New Chat modal open/closed.
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // ADDED: muted friend ids, persisted per logged-in user so it survives a
  // reload. Client-side only for now — there's no notification system yet
  // for this to actually gate, but the toggle + persistence is real.
  const [mutedIds, setMutedIds] = useState<Set<number>>(() => new Set());

  // ADDED: per-friend "clear conversation" cutoff. Clearing only hides
  // messages before this timestamp in THIS client — it can't reach into
  // useChatSocket's shared `messages` state or the server's persisted
  // history, so it's implemented as a client-side filter instead.
  const [clearedBefore, setClearedBefore] = useState<Record<number, string>>({});

  const userReady = Boolean(user && token);

  // Load muted ids once we know who the user is.
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`pacova-muted-${user.id}`);
      setMutedIds(new Set(raw ? (JSON.parse(raw) as number[]) : []));
    } catch (err) {
      console.warn('[CHAT] Failed to load muted friends from storage:', err);
    }
  }, [user?.id]);

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

  // ADDED: toggle mute for the currently selected friend, persisting the
  // updated set back to localStorage.
  const handleToggleMute = () => {
    if (!user) return;
    setMutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(selectedFriend.id)) next.delete(selectedFriend.id);
      else next.add(selectedFriend.id);
      try {
        localStorage.setItem(`pacova-muted-${user.id}`, JSON.stringify([...next]));
      } catch (err) {
        console.warn('[CHAT] Failed to persist muted friends:', err);
      }
      return next;
    });
  };

  // ADDED: hide everything before "now" for the current friend, in this
  // client only.
  const handleClearConversation = () => {
    setClearedBefore((prev) => ({ ...prev, [selectedFriend.id]: new Date().toISOString() }));
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

  const liveForFriend = messages.filter(
    (message) => message.sender_id === selectedFriend.id || message.receiver_id === selectedFriend.id
  );

  let conversation = [...historyMessages, ...liveForFriend].filter(
    (message, index, all) => all.findIndex((m) => m.id === message.id) === index
  );

  // ADDED: apply the per-friend clear cutoff, if one was set.
  const cutoff = clearedBefore[selectedFriend.id];
  if (cutoff) {
    conversation = conversation.filter((message) => message.created_at > cutoff);
  }

  const isBlockedEitherWay = blockStatus.iBlockedThem || blockStatus.theyBlockedMe;
  const isMutedSelected = mutedIds.has(selectedFriend.id);

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
          onSelectFriend={setSelectedFriend}
          onNewChat={() => setIsNewChatOpen(true)}
        />

        <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#050B1E] border-2 border-pacova-green-dark rounded-lg overflow-hidden">
          <ConversationHeader
            friend={selectedFriendLive}
            isFriendOnline={isFriendOnline}
            blockStatus={blockStatus}
            onToggleBlock={handleToggleBlock}
            isMuted={isMutedSelected}
            onToggleMute={handleToggleMute}
            onClearConversation={handleClearConversation}
          />

          <MessageList
            conversation={conversation}
            selectedFriend={selectedFriendLive}
            currentUserId={user.id}
            historyLoading={historyLoading}
            historyError={historyError}
            messagesEndRef={messagesEndRef}
          />

          <MessageInput draft={draft} onDraftChange={setDraft} onSend={handleSend} disabled={isBlockedEitherWay} />
        </section>
      </main>

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        friends={visibleFriendsLive}
        onSelectFriend={setSelectedFriend}
      />
    </Background>
  );
}