import type { RefObject } from 'react';
import { NEON_SCROLLBAR } from './constants';
import { formatMessageTimestamp } from './formatTimestamp';
import type { Friend, HistoryMessage } from './types';
import PacManIcon from './PacManIcon';
import { ICONS } from '../../utils/icons';
// import ReadPellet from './ReadPellet';

const GHOSTS: Array<keyof typeof ICONS> = ['gost-red', 'gost-pink', 'gost-blue', 'gost-orange'];

interface MessageListProps {
  conversation: HistoryMessage[];
  selectedFriend: Friend;
  currentUserId: number;
  historyLoading: boolean;
  historyError: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  dividerCutoff: string | null;
  friendReadAt: string | null;
  isTyping: boolean;
  pendingInvite: HistoryMessage | null;
  onSend: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export default function MessageList({
  conversation,
  selectedFriend,
  currentUserId,
  historyLoading,
  historyError,
  messagesEndRef,
  // dividerCutoff,
  friendReadAt,
  isTyping,
  pendingInvite,
  // onSend,
  onAccept,
  onDecline,
}: MessageListProps) {
  // ADDED: index of the first message that counts as "new" — the divider
  // renders right before it. -1 (via findIndex) means nothing qualifies.
  // const dividerIndex = dividerCutoff
  //   ? conversation.findIndex((message) => message.created_at > dividerCutoff)
  //   : -1;

  const isReceiver = Boolean(pendingInvite && pendingInvite.receiver_id === currentUserId);

  return (
    <div
      className={`flex-1 min-h-0 flex flex-col gap-4 p-5 overflow-y-auto overflow-x-hidden overscroll-contain ${NEON_SCROLLBAR}`}
    >
      {/* loading / error / empty states for chat history */}
      {historyLoading && (
        <p className="font-vt323 text-gray-600 text-lg text-center mt-8">Loading messages...</p>
      )}
      {!historyLoading && historyError && (
        <p className="font-vt323 text-red-500 text-lg text-center mt-8">{historyError}</p>
      )}
      {!historyLoading && !historyError && conversation.length === 0 && (
        <p className="font-vt323 text-gray-600 text-lg text-center mt-8">No messages yet</p>
      )}
      {conversation.map((message) => {
  const isOwn = message.sender_id === currentUserId;

  const isRead =
    isOwn &&
    (Boolean(message.read_at) ||
      Boolean(friendReadAt && message.created_at <= friendReadAt));

  if (message.kind === 'system') {
    return (
      <div key={message.id} className="contents">
        {/* {index === dividerIndex && (
          <div className="flex items-center gap-3 my-1" aria-label="New messages">
            <span className="flex-1 h-px bg-pacova-pink/50" />
            <span className="font-vt323 text-pacova-pink text-sm uppercase tracking-widest">
              New Messages
            </span>
            <span className="flex-1 h-px bg-pacova-pink/50" />
          </div>
        )} */}
        <p className="font-vt323 text-gray-500 text-sm text-center uppercase tracking-wide">
          {message.content}
        </p>
      </div>
    );
  }

  if (message.kind === 'game_invite') {
    // the pending one is rendered as the live card below; past invites just
    // show a quiet one-liner in the flow so the thread stays readable.
    if (message.meta?.status === 'pending') return null;
    return (
      <div key={message.id} className="contents">
        {/* {index === dividerIndex && (
          <div className="flex items-center gap-3 my-1" aria-label="New messages">
            <span className="flex-1 h-px bg-pacova-pink/50" />
            <span className="font-vt323 text-pacova-pink text-sm uppercase tracking-widest">
              New Messages
            </span>
            <span className="flex-1 h-px bg-pacova-pink/50" />
          </div>
        )} */}
        <p className="font-vt323 text-gray-500 text-sm text-center uppercase tracking-wide">
          Game invite {message.meta?.status}
        </p>
      </div>
    );
  }

  return (
    <div key={message.id} className="contents">
      {/* {index === dividerIndex && (
        <div className="flex items-center gap-3 my-1" aria-label="New messages">
          <span className="flex-1 h-px bg-pacova-pink/50" />
          <span className="font-vt323 text-pacova-pink text-sm uppercase tracking-widest">
            New Messages
          </span>
          <span className="flex-1 h-px bg-pacova-pink/50" />
        </div>
      )} */}

      <div
        className={`flex flex-col max-w-[80%] min-w-0 ${
          isOwn ? 'self-end items-end' : 'self-start items-start'
        }`}
      >
        <span
          className={`font-vt323 text-sm uppercase tracking-wide mb-1 ${
            isOwn ? 'text-pacova-pink' : 'text-pacova-green'
          }`}
        >
          {isOwn ? 'You' : selectedFriend.username}
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

        <span className="font-vt323 text-gray-500 text-sm mt-1 flex items-center gap-1.5">
          {isOwn && (
            <span className="tracking-[-2px]">
              {isRead ? '✓✓' : '✓'}
            </span>
          )}

          {formatMessageTimestamp(message.created_at)}
        </span>
      </div>
    </div>
  );
})}

{isTyping && (
  <div className="flex flex-col max-w-[80%] min-w-0 self-start items-start">
    <span className="font-vt323 text-sm uppercase tracking-wide mb-1 text-pacova-green">
      {selectedFriend.username}
    </span>

    <div className="px-4 py-3 pixel-corners-3step bg-pacova-green-dark/40 flex items-center gap-1.5">
      <span
        className="w-2 h-2 bg-pacova-green pixel-corners-3step animate-pulse"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-2 h-2 bg-pacova-green pixel-corners-3step animate-pulse"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-2 h-2 bg-pacova-green pixel-corners-3step animate-pulse"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  </div>
)}

{pendingInvite && (
  <div className="self-center w-full max-w-sm relative bg-pacova-surface border-2 border-pacova-green shadow-neon-green pixel-corners-3step p-5 text-center">
    <span className="absolute inset-0 pixel-scanlines pointer-events-none" />
    <div className="relative z-10 flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-black/60 border-2 border-pacova-green flex items-center justify-center">
        <PacManIcon className="w-8 h-8" />
      </div>
      <h3 className="font-pixelify text-pacova-green text-lg uppercase tracking-wide">
        Game Invitation
      </h3>
      <p className="font-vt323 text-lg text-gray-200">
        {isReceiver ? (
          <>
            <span className="text-white">{selectedFriend.username}</span> invited you to play
          </>
        ) : (
          <>
            Waiting for <span className="text-white">{selectedFriend.username}</span>…
          </>
        )}
        <br />
        <span className="font-pixelify text-xl text-pacova-green">Pac-Man</span>
      </p>
      <div className="flex gap-2">
        {GHOSTS.map((name) => (
          <img key={name} src={ICONS[name]} alt="" className="w-6 h-6" />
        ))}
      </div>
      {isReceiver && (
        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onAccept}
            className="px-4 py-1.5 rounded-full bg-pacova-green text-pacova-surface font-pixelify text-sm uppercase"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="px-4 py-1.5 rounded-full border-2 border-pacova-pink text-pacova-pink font-pixelify text-sm uppercase"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  </div>
)}

<div ref={messagesEndRef} />
    </div>
  );
}