import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatSocket } from '../hooks/useChatSocket';
import Background from '../components/ui/Background';
import Navbar from '../components/ui/Navbar';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import PixelButton from '../components/ui/PixelButton';
import type { IconName } from '../utils/icons';

function PacManIcon({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      fill="#FFD400"
      aria-hidden="true"
    >
      <path d="M12 12 L20.66 7 A10 10 0 1 0 20.66 17 Z" />
    </svg>
  );
}

const MOCK_FRIENDS: { id: number; username: string; icon: IconName; status: 'online' | 'offline' | 'busy' }[] = [
  { id: 2, username: 'user1', icon: 'gost-pink', status: 'online' },
  { id: 3, username: 'user2', icon: 'gost-red', status: 'online' },
  { id: 4, username: 'yassine', icon: 'gost-blue', status: 'offline' },
];

const routeMap: Record<string, string> = {
  HOME: '/home',
  PROFILE: '/profile',
  CHAT: '/chat',
  NOTIFICATION: '/notifications',
  SETTINGS: '/settings',
};

// Kills every glow/shine source (box-shadow, drop-shadow, filter) on buttons
// and inputs, no matter what the shared components bake in.
const NO_GLOW = 'shadow-none [box-shadow:none!important] [filter:none!important]';

// CHANGED: custom scrollbar classes so the message list's scrollbar matches
// the neon pink/green look instead of the default OS grey bar. Webkit gets
// the real styled bar; scrollbar-width/-color cover Firefox.
const NEON_SCROLLBAR =
  '[&::-webkit-scrollbar]:w-2 ' +
  '[&::-webkit-scrollbar-track]:bg-transparent ' +
  '[&::-webkit-scrollbar-thumb]:bg-pacova-pink/50 ' +
  '[&::-webkit-scrollbar-thumb]:rounded-full ' +
  'hover:[&::-webkit-scrollbar-thumb]:bg-pacova-pink ' +
  '[scrollbar-width:thin] ' +
  '[scrollbar-color:theme(colors.pacova-pink)_transparent]';

export default function Chat() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { isConnected, messages, sendMessage } = useChatSocket(
    user && token ? `wss://localhost/api/chat/ws?token=${token}` : '',
    user ? Number(user.id) : 0
  );
  const [selectedFriend, setSelectedFriend] = useState(MOCK_FRIENDS[0]);
  const [draft, setDraft] = useState('');

  // CHANGED: ref to the always-empty div at the end of the message list, so
  // we can scroll it into view whenever a new message arrives instead of
  // leaving the user stuck wherever they were scrolled to.
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

  // ONLINE only when the selected friend's status says so AND the chat socket
  // is actually connected — nothing hardcoded.
  const isFriendOnline = selectedFriend.status === 'online' && isConnected;

  const conversation = messages.filter(
    (message) => message.sender_id === selectedFriend.id || message.receiver_id === selectedFriend.id
  );

  // CHANGED: fires whenever the visible conversation grows (new message sent
  // or received, or friend switched) and jumps the list to the bottom.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, selectedFriend.id]);

  return (
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={handleSelectTab} />

      <main className="flex-1 min-h-0 h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] max-w-[1320px] mx-auto w-full px-4 py-5 flex gap-5 overflow-hidden">
        <div className="w-[22rem] shrink-0 min-h-0 flex flex-col bg-[#050B1E] border-2 border-pacova-green-dark rounded-lg overflow-hidden">
          <h2 className="font-pixelify text-pacova-green text-2xl uppercase tracking-wider text-center px-5 h-20 flex items-center justify-center gap-4 border-b-2 border-pacova-green-dark">
            <PacManIcon className="w-7 h-7 shrink-0" />
            Friends
            <PacManIcon className="w-7 h-7 shrink-0" flip />
          </h2>

          <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0 p-4">
            {MOCK_FRIENDS.map((friend) => {
              const isSelected = friend.id === selectedFriend.id;
              return (
                <button
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md border-2 transition-colors text-left ${NO_GLOW} ${
                    isSelected
                      ? friend.status === 'offline'
                        ? 'border-red-500'
                        : 'border-pacova-green'
                      : 'border-transparent hover:border-pacova-gray'
                  }`}
                >
                  <span className="rounded-full overflow-hidden ring-2 ring-pacova-green-dark/60 shrink-0">
                    <Avatar iconName={friend.icon} size="sm" status={friend.status} />
                  </span>
                  <span className="font-vt323 text-white text-lg uppercase truncate flex-1">
                    {friend.username}
                  </span>
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      friend.status === 'online'
                        ? 'bg-pacova-green'
                        : friend.status === 'busy'
                          ? 'bg-pacova-pink-dark'
                          : 'bg-red-500'
                    }`}
                    aria-label={friend.status}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-auto h-[76px] px-4 flex items-center border-t-2 border-pacova-green-dark">
            {/* CHANGED: size bumped from "sm" to "lg" — her new sizeStyles
                made "sm" only 32px tall, too small. */}
            <PixelButton
              type="button"
              variant="outline-green"
              size="lg"
              className={`w-full ${NO_GLOW}`}
              onClick={() => undefined}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                  <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5.2l-2.8 3-2.8-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 4v2h2V8H6Zm5 0v2h2V8h-2Zm5 0v2h2V8h-2Z" />
                </svg>
                New Chat
              </span>
            </PixelButton>
          </div>

        </div>

        <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#050B1E] border-2 border-pacova-green-dark rounded-lg overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 h-20 border-b-2 border-pacova-green-dark">
            <div className="flex items-center gap-3 min-w-0">
              <span className="rounded-full overflow-hidden ring-2 ring-pacova-green-dark/60 shrink-0">
                <Avatar iconName={selectedFriend.icon} size="sm" status={selectedFriend.status} />
              </span>
              <div className="min-w-0">
                <span className="font-pixelify text-white text-lg uppercase block truncate">
                  {selectedFriend.username}
                </span>
                <span
                  className={`font-vt323 text-base uppercase tracking-wide ${
                    isFriendOnline
                      ? 'text-pacova-green'
                      : 'text-red-500'
                  }`}
                >
                  {isFriendOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Chat options"
              onClick={() => undefined}
              className={`p-2 rounded-md text-pacova-green hover:bg-pacova-green/10 transition-colors ${NO_GLOW}`}
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          </div>

          {/* CHANGED: added NEON_SCROLLBAR so this list's scrollbar matches
              the design, and a bottom sentinel div + ref so we can
              auto-scroll to the newest message. */}
          <div className={`flex-1 min-h-0 flex flex-col gap-4 p-5 overflow-y-auto overflow-x-hidden overscroll-contain ${NEON_SCROLLBAR}`}>
            {conversation.length === 0 && (
              <p className="font-vt323 text-gray-600 text-lg text-center mt-8">No messages yet</p>
            )}
            {conversation.map((message) => {
              const isOwn = message.sender_id === user.id;
              return (
                <div
                  key={message.id}
                  className={`flex flex-col max-w-[80%] min-w-0 ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <span
                    className={`font-vt323 text-sm uppercase tracking-wide mb-1 ${
                      isOwn ? 'text-pacova-pink' : 'text-pacova-green'
                    }`}
                  >
                    {isOwn ? 'You' : selectedFriend.username}{' '}
                    <span className="text-gray-500 normal-case">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </span>
                  </span>
                  <div
                    className={`px-4 py-2 pixel-corners-3step font-vt323 text-lg break-words [overflow-wrap:anywhere] max-w-full ${
                      isOwn
                        ? 'bg-pacova-pink-dark/40 text-white'
                        : 'bg-pacova-green-dark/40 text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
            {/* CHANGED: bottom sentinel — scrollIntoView target for auto-scroll */}
            <div ref={messagesEndRef} />
          </div>

          <div className="h-[76px] px-4 flex items-center gap-3 border-t-2 border-pacova-green-dark">
            <div className="flex-1 min-w-0 [&>div]:w-full">
              {/* CHANGED: forced a solid-ish background + brighter, larger
                  text so the grid pattern behind the page stops bleeding
                  through and making the typed text hard to read. */}
              <Input
                type="text"
                placeholder="Type message..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                className={`w-full !border-pacova-pink !bg-[#080B1A] !text-white placeholder:!text-white/50 !text-lg sm:!text-xl !py-3 ${NO_GLOW} focus:!shadow-none focus:[box-shadow:none!important]`}
              />
            </div>

            {/* CHANGED: border override removed — back to the variant's
                default green border/text, and size bumped to "lg" like
                New Chat above. */}
            <PixelButton
              type="button"
              variant="outline-green"
              size="lg"
              className={NO_GLOW}
              onClick={handleSend}
            >
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                  <path d="M21.7 3.3a1 1 0 0 0-1.03-.24l-18 6a1 1 0 0 0 .08 1.92l7.26 1.82 1.82 7.26a1 1 0 0 0 .91.76h.06a1 1 0 0 0 .9-.57l6-18a1 1 0 0 0 0-1.95ZM4.6 10.1l12.1-4.03-6.04 6.04L4.6 10.1Zm7.96 7.96-1.04-4.16 6.04-6.04-5 10.2Z" />
                </svg>
                Send
              </span>
            </PixelButton>
          </div>

        </section>
      </main>
    </Background>
  );
}