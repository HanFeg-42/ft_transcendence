import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PixelButton from '../../components/ui/PixelButton';
import type { ChatMessageIncoming as Message } from '../../../../shared/types/chat-types';
import type { Friend } from '../../hooks/useChat';




export function PacManIcon({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="#FFD400" aria-hidden="true">
      <path d="M12 12 L20.66 7 A10 10 0 1 0 20.66 17 Z" />
    </svg>
  );
}

// "Oct 9, 03:15 PM"
const formatTime = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const bubble = (own: boolean) =>
  `px-4 py-2 pixel-corners-3step font-vt323 text-lg break-words [overflow-wrap:anywhere] max-w-full text-white ${own ? 'bg-pacova-pink-dark/40' : 'bg-pacova-green-dark/40'}`;
const row = (own: boolean) => `flex flex-col max-w-[80%] min-w-0 ${own ? 'self-end items-end' : 'self-start items-start'}`;
const label = (own: boolean) => `font-vt323 text-sm uppercase tracking-wide mb-1 ${own ? 'text-pacova-pink' : 'text-pacova-green'}`;





export default function MessageList({ conversation, friend, myId, status, isTyping, friendReadAt }: {
  conversation: Message[];
  friend: Friend;
  myId: number;
  status: 'loading' | 'error' | 'ok';
  isTyping: boolean;
  friendReadAt: string | null;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the view at the bottom.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, friend.id, status, isTyping]);

  const inviteLabels = { accepted: t('chat_inviteAccepted'), declined: t('chat_inviteDeclined'), expired: t('chat_inviteExpired') };
  const info = 'font-vt323 text-lg text-center mt-8';


  
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 p-5 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-color:var(--color-pacova-gray)_transparent]">
      {status === 'loading' && <p className={`${info} text-gray-600`}>{t('chat_loadingMessages')}</p>}
      {status === 'error' && <p className={`${info} text-red-500`}>{t('chat_loadError')}</p>}
      {status === 'ok' && conversation.length === 0 && <p className={`${info} text-gray-600`}>{t('chat_noMessages')}</p>}

      {conversation.map((m) => {
        const own = m.sender_id === myId;

        if (m.kind === 'game_invite') {
          const state = m.meta?.status;
          const gameId = m.meta?.gameId;
          return (
            <div key={m.id} className="flex flex-col items-center gap-2 my-4 w-full">
              <p className="font-vt323 text-gray-400 text-base uppercase tracking-wide text-center">
                {own ? t('chat_invitationSent') : t('chat_friendInvitedYou', { name: friend.username })}
                {state && state !== 'pending' && <><br />{inviteLabels[state]}</>}
              </p>
              {state === 'accepted' && gameId && (
                <PixelButton
                  variant="warning-yellow"
                  size="sm"
                  onClick={() => navigate(`/game/online?gameId=${gameId}`)}
                >
                  <PacManIcon className="w-5 h-5" />
                  {t('chat_startGame')}
                </PixelButton>
              )}
            </div>
          );
        }

        const read = m.read_at != null || (friendReadAt != null && m.created_at <= friendReadAt);
        return (
          <div key={m.id} className={row(own)}>
            <span className={label(own)}>{own ? t('chat_you') : friend.username}</span>
            <div className={bubble(own)}>{m.content}</div>
            <span className="font-vt323 text-gray-500 text-sm mt-1 flex items-center gap-1.5">
              {own && <span className="tracking-[-2px]">{read ? '✓✓' : '✓'}</span>}
              {formatTime(m.created_at)}
            </span>
          </div>
        );
      })}

      {isTyping && (
        <div className={row(false)}>
          <span className={label(false)}>{friend.username}</span>
          <div className={`px-4 py-2 pixel-corners-3step font-vt323 text-lg max-w-full bg-pacova-green-dark/40 animate-pulse text-pacova-green`}>...</div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}