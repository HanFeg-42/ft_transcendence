import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChatMessageIncoming as Message } from '../../../../shared/types/chat-types';
import { GAME_ROUTE, NEON_SCROLLBAR, formatTime, type Friend } from './helpers';
import { PacManIcon } from './Parts';
import { useTranslation } from "react-i18next"; 

interface MessageListProps {
  conversation: Message[];
  friend: Friend;
  myId: number;
  status: 'loading' | 'error' | 'ok';
  isTyping: boolean;
  friendReadAt: string | null;
}

export default function MessageList({ conversation, friend, myId, status, isTyping, friendReadAt }: MessageListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the view at the bottom.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, friend.id, status, isTyping]);

  // Only the most recent invite gets a "Start Game" button.
  const invites = conversation.filter((m) => m.kind === 'game_invite');
  const lastInviteId = invites[invites.length - 1]?.id;

  const info = 'font-vt323 text-lg text-center mt-8';

  return (
    <div className={`flex-1 min-h-0 flex flex-col gap-4 p-5 overflow-y-auto overflow-x-hidden overscroll-contain ${NEON_SCROLLBAR}`}>
      {status === 'loading' && <p className={`${info} text-gray-600`}>{t('chat_loadingMessages')}</p>}
      {status === 'error' && <p className={`${info} text-red-500`}>{t('chat_loadError')}</p>}
      {status === 'ok' && conversation.length === 0 && <p className={`${info} text-gray-600`}>{t('chat_noMessages')}</p>}

      {conversation.map((message) => {
        const isOwn = message.sender_id === myId;


        if (message.kind === 'game_invite') {
          const inviteStatus = message.meta?.status;
          const gameId = message.meta?.gameId;
          const inviteLabels: Record<string, string> = {
            accepted: t('chat_inviteAccepted'),
            declined: t('chat_inviteDeclined'),
            expired: t('chat_inviteExpired'),
          };
          // "Start Game" only on the latest accepted invite, and only until it is pressed once
          // (remembered in this browser, so it stays hidden when coming back from the game).
          const canStart =
            inviteStatus === 'accepted' && message.id === lastInviteId && gameId && !localStorage.getItem(`started:${gameId}`);

          return (
            <div key={message.id} className="flex flex-col items-center gap-2 my-4 w-full">
              <p className="font-vt323 text-gray-400 text-base uppercase tracking-wide text-center">
                {isOwn ? t('chat_invitationSent') : t('chat_friendInvitedYou', { name: friend.username })}
                {inviteStatus && inviteStatus !== 'pending' && <><br />{inviteLabels[inviteStatus]}</>}
              </p>

              {canStart && (
                <button
                  type="button"
                  onClick={() => { localStorage.setItem(`started:${gameId}`, '1'); navigate(`${GAME_ROUTE}?gameId=${gameId}`); }}
                  // onClick={() => { localStorage.setItem(`started:${gameId}`, '1'); navigate(GAME_ROUTE); }}
                  className="flex items-center gap-2 mt-1 px-4 py-2 bg-black/80 border-2 border-amber-400 text-amber-300 font-pixelify text-sm uppercase tracking-wide shadow-[0_0_12px_rgba(245,158,11,0.6)] hover:brightness-125 transition-all rounded"
                >
                  <PacManIcon className="w-5 h-5" />
                  {t('chat_startGame')}
                </button>
              )}
            </div>
          );
        }

        const isRead = message.read_at != null || (friendReadAt != null && message.created_at <= friendReadAt);

        return (
          <div key={message.id} className={`flex flex-col max-w-[80%] min-w-0 ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}>
            <span className={`font-vt323 text-sm uppercase tracking-wide mb-1 ${isOwn ? 'text-pacova-pink' : 'text-pacova-green'}`}>
              {isOwn ? t('chat_you') : friend.username}
            </span>
            <div className={`px-4 py-2 pixel-corners-3step font-vt323 text-lg break-words [overflow-wrap:anywhere] max-w-full text-white ${isOwn ? 'bg-pacova-pink-dark/40' : 'bg-pacova-green-dark/40'}`}>
              {message.content}
            </div>
            <span className="font-vt323 text-gray-500 text-sm mt-1 flex items-center gap-1.5">
              {isOwn && <span className="tracking-[-2px]">{isRead ? '✓✓' : '✓'}</span>}
              {formatTime(message.created_at)}
            </span>
          </div>
        );
      })}

      {isTyping && (
        <div className="flex flex-col max-w-[80%] min-w-0 self-start items-start">
          <span className="font-vt323 text-sm uppercase tracking-wide mb-1 text-pacova-green">{friend.username}</span>
          <div className="px-4 py-3 pixel-corners-3step bg-pacova-green-dark/40 flex items-center gap-1.5">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-2 h-2 bg-pacova-green pixel-corners-3step animate-pulse"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}