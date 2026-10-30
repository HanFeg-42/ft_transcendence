import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Background from '../../components/ui/Background';
import Navbar from '../../components/ui/Navbar';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import PixelButton from '../../components/ui/PixelButton';
import { routeMap } from './helpers';
import useChat, { type Friend } from './useChat';
import MessageList, { PacManIcon } from './MessageList';

const PANEL = 'bg-pacova-surface border-2 border-pacova-green-dark rounded-lg';

function FriendAvatar({ friend }: { friend: Friend }) {
  const { t } = useTranslation();
  return (
    <span className="rounded-full overflow-hidden ring-2 ring-pacova-green-dark/60 shrink-0">
      {friend.avatar ? (
        <img src={friend.avatar} alt={t('chat_avatarAlt', { username: friend.username })} className="w-10 h-10 object-cover" />
      ) : (
        <Avatar iconName="packmann" size="sm" />
      )}
    </span>
  );
}

function GameInviteModal({ name, receiver, onAnswer }: { name: string; receiver: boolean; onAnswer: (yes: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card variant="green" className="max-w-sm !h-auto text-center">
        <div className="flex flex-col items-center gap-4">
          <PacManIcon className="w-16 h-16" />
          <p className="font-vt323 text-lg">
            <span className="break-all">{receiver ? t('chat_invitedYou', { name }) : t('chat_inviteTo', { name })}</span>
            <br />
            <span className="font-pixelify text-2xl text-pacova-green">Pacova</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <PixelButton variant="filled-green" onClick={() => onAnswer(true)}>
              {receiver ? t('chat_accept') : t('chat_inviteToPlay')}
            </PixelButton>
            <PixelButton variant="outline-magenta" onClick={() => onAnswer(false)}>
              {receiver ? t('chat_decline') : t('chat_cancel')}
            </PixelButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Chat() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const chat = useChat(token);
  const { friend, conversation, blocked } = chat;
  const myId = user ? Number(user.id) : 0;

  const [draft, setDraft] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);

  const pendingInvites = conversation.filter((m) => m.kind === 'game_invite' && m.meta?.status === 'pending');
  const incomingInvite = pendingInvites.findLast((m) => m.receiver_id === myId);

  const page = (children: React.ReactNode) => (
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={(tab) => routeMap[tab] && navigate(routeMap[tab])} />
      {children}
    </Background>
  );

  const screen = (text: string, extra = '') =>
    page(
      <main className="flex-1 flex items-center justify-center">
        <h1 className={`font-pixelify text-pacova-pink text-2xl uppercase text-center px-4 ${extra}`}>{text}</h1>
      </main>,
    );

  if (!user || !token) return screen(t('chat_loading'));
  if (chat.reconnecting) return screen(t('chat_reconnecting'), 'animate-pulse');
  if (!friend) return screen(t('chat_noFriends'));

  function pick(id: number) {
    chat.select(id);
    setInviteOpen(false);
    setFriendsOpen(false);
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    chat.sendMessage(text);
    setDraft('');
  }

  function answerInvite(yes: boolean) {
    if (incomingInvite) chat.replyInvite(incomingInvite.id, yes);
    else {
      if (yes) chat.sendInvite();
      setInviteOpen(false);
    }
  }

  return page(
    <main className="flex-1 h-[calc(100dvh-152px)] max-h-[calc(100dvh-152px)] sm:h-[calc(100dvh-128px)] sm:max-h-[calc(100dvh-128px)] max-w-[1320px] mx-auto w-full p-2 md:px-4 md:py-5 flex gap-5 overflow-hidden">
      <aside className={`${friendsOpen ? 'flex fixed inset-x-4 top-24 bottom-4 z-40' : 'hidden'} md:flex md:static md:w-[22rem] shrink-0 flex-col overflow-hidden ${PANEL}`}>
        <h2 className="font-pixelify text-pacova-green text-2xl uppercase tracking-wider px-5 h-20 flex items-center justify-center gap-4 border-b-2 border-pacova-green-dark">
          <PacManIcon className="w-7 h-7 shrink-0" />
          {t('chat_friends')}
          <PacManIcon className="w-7 h-7 shrink-0" flip />
        </h2>
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-4 [scrollbar-color:var(--color-pacova-gray)_transparent]">
          {chat.friends.map((f) => (
            <button
              key={f.id}
              onClick={() => pick(f.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-md border-2 transition-colors text-start ${
                f.id === friend.id ? 'border-pacova-green' : 'border-transparent hover:border-pacova-gray'
              }`}
            >
              <FriendAvatar friend={f} />
              <span className="font-vt323 text-white text-lg uppercase truncate flex-1">{f.username}</span>
              <span className={`w-3 h-3 rounded-full shrink-0 ${f.online ? 'bg-pacova-green' : 'bg-gray-500'}`} aria-label={f.online ? 'online' : 'offline'} />
            </button>
          ))}
        </div>
      </aside>

      <section className={`flex-1 flex flex-col overflow-hidden ${PANEL}`}>
        <div className="flex items-center gap-4 px-3 md:px-5 h-20 border-b-2 border-pacova-green-dark">
          <button onClick={() => setFriendsOpen((o) => !o)} aria-label={t('chat_friends')} className="md:hidden p-1 text-pacova-green">
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
              <path d="M3 5h18v2.5H3zM3 10.75h18v2.5H3zM3 16.5h18v2.5H3z" />
            </svg>
          </button>
          <button title={t('chat_viewProfile')} onClick={() => navigate(`/profile/${friend.id}`)} className="flex items-center gap-3 min-w-0 disabled:cursor-not-allowed">
            <FriendAvatar friend={friend} />
            <span className="font-pixelify text-white text-lg uppercase truncate">{friend.username}</span>
          </button>
          <div className="ms-auto flex items-center gap-2 shrink-0">
            <button onClick={() => setInviteOpen(true)} disabled={pendingInvites.length > 0} title={t('chat_inviteToPlay')} aria-label={t('chat_inviteToPlay')} className="p-2 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed">
              <PacManIcon className="w-6 h-6" />
            </button>
            <button
  onClick={() => {
    if (blocked || window.confirm(`Block ${friend.username}?`)) {
      chat.toggleBlock();
    }
  }}
  className="px-3 py-2 rounded-md font-vt323 text-lg uppercase text-red-500 hover:bg-red-500/10"
>
  {blocked ? 'Unblock' : 'Block'}
</button>
          </div>
        </div>

        <MessageList conversation={conversation} friend={friend} myId={myId} status={chat.status} isTyping={chat.typing} friendReadAt={chat.friendReadAt} />

        {(incomingInvite || inviteOpen) && <GameInviteModal receiver={!!incomingInvite} name={friend.username} onAnswer={answerInvite} />}

        {chat.error && <p className="px-4 font-vt323 text-lg text-pacova-pink">{chat.error}</p>}

        <div className="h-[76px] px-4 flex items-center gap-3 border-t-2 border-pacova-green-dark">
          <Input
            className="!border-pacova-pink !bg-[#080B1A] text-lg sm:!text-xl !py-3 disabled:opacity-40"
            value={draft}
            type="text"
            maxLength={1000}
            onChange={(e) => {
              setDraft(e.target.value);
              if (e.target.value.trim()) chat.sendTyping();
            }}
            placeholder={t('chat_cannotMessage')}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <PixelButton variant="outline-green" size="lg" onClick={send}>
            {t('chat_send')}
          </PixelButton>
        </div>
      </section>
    </main>,
  );
}