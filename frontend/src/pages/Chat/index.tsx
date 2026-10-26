import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Background from '../../components/ui/Background';
import Navbar from '../../components/ui/Navbar';
import { Input } from '../../components/ui/Input';
import PixelButton from '../../components/ui/PixelButton';
import useChat from './useChat';
import MessageList from './MessageList';
import { Sidebar, Header, NewChatModal, GameInviteModal } from './Parts';
import { type Friend, NO_GLOW, routeMap } from './helpers';
// import Avatar from '../../components/ui/Avatar';
// import Avatar from '../../components/ui/Avatar';

export default function Chat() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const myId = user ? Number(user.id) : 0;

  const [selectedId, setSelectedId] = useState(0);
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [draft, setDraft] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const lastTypingSent = useRef<Record<number, number>>({}); // per friend
  const [friendsOpen, setFriendsOpen] = useState(false);



  useEffect(() => {
    if (!token) return;
    fetch('/api/chat/friends', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setFriendList(data.map((f: any) => ({ id: f.id, username: f.username, status: f.online ? 'online' : 'offline', avatar: f.avatar ?? null}))))
      .catch(console.error);
  }, [token]);

  const friendId = friendList.some((f) => f.id === selectedId) ? selectedId : friendList[0]?.id ?? 0;

  const chat = useChat(token, friendId);
  const { conversation, sendRead } = chat;

  // Friends with their live online/offline status.
  const friends = friendList.map((f) => ({
    ...f,
    status: f.id === friendId && chat.iBlockedThem ? 'offline' : chat.presence[f.id] ?? f.status,
  }));
  const friend = friends.find((f) => f.id === friendId) ?? friends[0];

  const blocked = chat.iBlockedThem;
  const pendingInvites = conversation.filter((m) => m.kind === 'game_invite' && m.meta?.status === 'pending');
  const invitesForMe = pendingInvites.filter((m) => m.receiver_id === myId);
  const incomingInvite = invitesForMe[invitesForMe.length - 1]; // latest one


  

  // Tell the server we read this chat: on new messages, friend change, and when the tab regains focus.
  useEffect(() => {
    const markRead = () => {
      if (friendId && document.visibilityState === 'visible') sendRead(friendId);
    };
    markRead();
    document.addEventListener('visibilitychange', markRead);
    return () => document.removeEventListener('visibilitychange', markRead);
  }, [conversation.length, friendId]);

  function goToTab(tab: string) {
    if (routeMap[tab]) navigate(routeMap[tab]);
  }

  // function selectFriend(id: number) {
  //   setSelectedId(id);
  //   setInviteOpen(false);
  // }

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    chat.sendMessage(friendId, text);
    setDraft('');
  }

  // Update the draft and tell the friend we're typing (at most once every 2s).
  function handleDraftChange(value: string) {
    setDraft(value);
    if (value.trim() && Date.now() - (lastTypingSent.current[friendId] ?? 0) > 2000) {
      chat.sendTyping(friendId);
      lastTypingSent.current[friendId] = Date.now();
    }
  }

  // selecting a friend closes the list
  function selectFriend(id: number) {
    setSelectedId(id);
    setInviteOpen(false);
    setFriendsOpen(false);
  }


  if (!user || !token) {
    return (
      <Background>
        <Navbar activeTab="CHAT" onSelectTab={goToTab} />
        <main className="flex-1 flex items-center justify-center">
          <h1 className="font-pixelify text-pacova-pink text-3xl uppercase">Loading...</h1>
        </main>
      </Background>
    );
  }

  if (chat.reconnecting) {
    return (
      <Background>
        <Navbar activeTab="CHAT" onSelectTab={goToTab} />
        <main className="flex-1 flex items-center justify-center">
          <h1 className="font-pixelify text-pacova-pink text-2xl uppercase animate-pulse">Reconnecting…</h1>
        </main>
      </Background>
    );
  }

  if (!friend) {
    return (
      <Background>
        <Navbar activeTab="CHAT" onSelectTab={goToTab} />
        <main className="flex-1 flex items-center justify-center">
          <h1 className="font-pixelify text-pacova-pink text-2xl uppercase text-center px-4">
            {'No friends yet'}
          </h1>
        </main>
      </Background>
    );
  }

  return (
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={goToTab} />
      <main className="flex-1 min-h-0 h-[calc(100dvh-152px)] max-h-[calc(100dvh-152px)] sm:h-[calc(100dvh-128px)] sm:max-h-[calc(100dvh-128px)] max-w-[1320px] mx-auto w-full px-2 py-2 md:px-4 md:py-5 flex gap-5 overflow-hidden">
        <Sidebar friends={friends} selectedId={friendId} onSelect={selectFriend} onNewChat={() => setNewChatOpen(true)} open={friendsOpen}/>

        <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-pacova-surface border-2 border-pacova-green-dark rounded-lg overflow-hidden">
          <Header
            key={friend.id}
            friend={friend}
            blocked={blocked}
            onToggleBlock={chat.toggleBlock}
            onInvite={() => setInviteOpen(true)}
            inviteDisabled={blocked || pendingInvites.length > 0}
            onToggleFriends={() => setFriendsOpen((o) => !o)}
          />

          <MessageList
            conversation={conversation}
            friend={friend}
            myId={myId}
            status={chat.status}
            isTyping={chat.typing[friendId] ?? false}
            friendReadAt={chat.readAt[friendId] ?? null}
          />

          {incomingInvite ? (
            <GameInviteModal
              receiver
              name={friend.username}
              onYes={() => chat.replyInvite(incomingInvite.id, true)}
              onNo={() => chat.replyInvite(incomingInvite.id, false)}
            />
          ) : (
            inviteOpen && (
              <GameInviteModal
                name={friend.username}
                onYes={() => {
                  chat.sendInvite(friendId);
                  setInviteOpen(false);
                }}
                onNo={() => setInviteOpen(false)}
              />
            )
          )}

            {chat.error && <p className="px-4 font-vt323 text-lg text-pacova-pink">{chat.error}</p>}

          <div className="h-[76px] px-4 flex items-center gap-3 border-t-2 border-pacova-green-dark">
            <Input
              className={`min-w-0 w-full !border-pacova-pink !bg-[#080B1A] !text-white placeholder:!text-white/50 !text-lg sm:!text-xl !py-3 disabled:opacity-40 ${NO_GLOW} focus:!shadow-none focus:[box-shadow:none!important]`}
              value={draft}
              type="text"
              maxLength={1000}
              disabled={blocked}
              onChange={(e) => handleDraftChange(e.target.value)}
              placeholder={blocked ? 'You cannot message this user' : 'Type a message...'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
            />
            <PixelButton type="button" variant="outline-green" size="lg" className={NO_GLOW} onClick={handleSend} disabled={blocked}>
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                  <path d="M21.7 3.3a1 1 0 0 0-1.03-.24l-18 6a1 1 0 0 0 .08 1.92l7.26 1.82 1.82 7.26a1 1 0 0 0 .91.76h.06a1 1 0 0 0 .9-.57l6-18a1 1 0 0 0 0-1.95ZM4.6 10.1l12.1-4.03-6.04 6.04L4.6 10.1Zm7.96 7.96-1.04-4.16 6.04-6.04-5 10.2Z" />
                </svg>
                <span className="hidden sm:inline">Send</span>
              </span>
            </PixelButton>
          </div>
        </section>
      </main>

      {newChatOpen && (
        <NewChatModal friends={friends} onSelect={selectFriend} onClose={() => setNewChatOpen(false)} />
      )}
    </Background>
  );
}