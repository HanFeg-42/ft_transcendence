import type { RefObject } from 'react';
import { NEON_SCROLLBAR } from './constants';
import type { Friend, HistoryMessage } from './types';

interface MessageListProps {
  conversation: HistoryMessage[];
  selectedFriend: Friend;
  currentUserId: number;
  historyLoading: boolean;
  historyError: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export default function MessageList({
  conversation,
  selectedFriend,
  currentUserId,
  historyLoading,
  historyError,
  messagesEndRef,
}: MessageListProps) {
  return (
    <div
      className={`flex-1 min-h-0 flex flex-col gap-4 p-5 overflow-y-auto overflow-x-hidden overscroll-contain ${NEON_SCROLLBAR}`}
    >
      {/* ADDED: loading / error / empty states for chat history */}
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
                isOwn ? 'bg-pacova-pink-dark/40 text-white' : 'bg-pacova-green-dark/40 text-white'
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
  );
}