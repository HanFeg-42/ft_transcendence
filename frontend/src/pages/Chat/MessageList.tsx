import type { RefObject } from 'react';
import { NEON_SCROLLBAR } from './constants';
import { formatMessageTimestamp } from './formatTimestamp';
import type { Friend, HistoryMessage } from './types';

interface MessageListProps {
  conversation: HistoryMessage[];
  selectedFriend: Friend;
  currentUserId: number;
  historyLoading: boolean;
  historyError: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  // ADDED: any message with created_at strictly after this timestamp is
  // "new since you last left this conversation" — null means either this
  // is the very first time it's been opened, or nothing qualifies.
  dividerCutoff: string | null;
}

export default function MessageList({
  conversation,
  selectedFriend,
  currentUserId,
  historyLoading,
  historyError,
  messagesEndRef,
  dividerCutoff,
}: MessageListProps) {
  // ADDED: index of the first message that counts as "new" — the divider
  // renders right before it. -1 (via findIndex) means nothing qualifies.
  const dividerIndex = dividerCutoff
    ? conversation.findIndex((message) => message.created_at > dividerCutoff)
    : -1;

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
      {conversation.map((message, index) => {
        const isOwn = message.sender_id === currentUserId;
        return (
          <div key={message.id} className="contents">
            {/* ADDED: unread divider, shown once right before the first new message */}
            {index === dividerIndex && (
              <div className="flex items-center gap-3 my-1" aria-label="New messages">
                <span className="flex-1 h-px bg-pacova-pink/50" />
                <span className="font-vt323 text-pacova-pink text-sm uppercase tracking-widest">
                  New Messages
                </span>
                <span className="flex-1 h-px bg-pacova-pink/50" />
              </div>
            )}
            <div
              className={`flex flex-col max-w-[80%] min-w-0 ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <span
                className={`font-vt323 text-sm uppercase tracking-wide mb-1 ${
                  isOwn ? 'text-pacova-pink' : 'text-pacova-green'
                }`}
              >
                {isOwn ? 'You' : selectedFriend.username}{' '}
                <span className="text-gray-500 normal-case">
                  {formatMessageTimestamp(message.created_at)}
                </span>
              </span>
              <div
                className={`px-4 py-2 pixel-corners-3step font-vt323 text-lg break-words [overflow-wrap:anywhere] max-w-full ${
                  isOwn ? 'bg-pacova-pink-dark/40 text-white' : 'bg-pacova-green-dark/40 text-white'
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        );
      })}
      {/* bottom sentinel — scrollIntoView target for auto-scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
}