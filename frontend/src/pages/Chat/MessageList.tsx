import type { Friend, Message } from './types';
import { formatMessageTimestamp } from './formatTimestamp'
import { useState, type RefObject } from 'react';
import { NEON_SCROLLBAR } from './constants';
import PacManIcon from './PacManIcon';
// import { ICONS } from '../../utils/icons';
// import PixelButton from '../../components/ui/PixelButton';

interface MessageListProps{
    conversation: Message[];
    selectedFriend: Friend;
    currentUserId: number;
    loading: boolean;
    error: string | null;
    messagesEndRef: RefObject<HTMLDivElement | null>;
    isTyping: boolean;
    friendReadAt: string | null;
    onStartGame: (gameId: string) => void;
}

export default function MessageList({
    conversation, 
    selectedFriend,
    currentUserId,
    loading,
    error,
    messagesEndRef,
    isTyping,
    friendReadAt,
    onStartGame
} : MessageListProps){
    
    // 1. State to track started games so the button disappears and shows "Game started"
    const [startedGameId, setStartedGameId] = useState<string | null>(null);

    // Compute the id of the last game invite message (copy array before reversing)
    const lastInviteId = [...conversation]
        .reverse()
        .find((msg) => msg.kind === 'game_invite')?.id;



    return (
        <div className={`flex-1 min-h-0 flex flex-col gap-4 p-5 overflow-y-auto overflow-x-hidden overscroll-contain ${NEON_SCROLLBAR}`}>

            {loading && (
                    <p className="font-vt323 text-gray-600 text-lg text-center mt-8">Loading messages...</p>
            )}
            {!loading && error && (
              <p className="font-vt323 text-red-500 text-lg text-center mt-8">{error}</p>
            )}
            {!loading && !error && conversation.length === 0 && (
              <p className="font-vt323 text-gray-600 text-lg text-center mt-8">No messages yet</p>
            )}


            {conversation.map((message) => {
                const isOwn = message.sender_id === currentUserId;
                const isRead = message.read_at != null || (friendReadAt != null && message.created_at <= friendReadAt);          

                if (message.kind === 'system') return null;

                // 2. Render game invites
                if (message.kind === 'game_invite') {
                    const status = message.meta?.status;
                    const gameId = message.meta?.gameId;
                    const isLatestAccepted = status === 'accepted' && message.id === lastInviteId && gameId;

                    return (
                        <div key={message.id} className="flex flex-col items-center gap-2 my-4 w-full">
                            {/* Notification lines with a subtle dark shining background chip for clarity */}
                            <div className="flex flex-col items-center gap-1.5 px-4 py-2 bg-black/40 border border-pacova-purple/30 rounded shadow-[0_0_10px_rgba(168,85,247,0.15)] text-center">
                                <span className="font-vt323 uppercase text-pacova-purple text-base tracking-wide">
                                    {isOwn ? "Invitation sent" : `${selectedFriend.username} invited you`}
                                </span>
                    
                                {status === 'accepted' && (
                                    <span className="font-vt323 uppercase text-base tracking-wide text-pacova-purple">
                                        Invite accepted
                                    </span>
                                )}
                                {status === 'declined' && (
                                    <span className="font-vt323 uppercase text-base tracking-wide text-red-400">
                                        Invite declined
                                    </span>
                                )}
                            </div>
                            
                            {/* Clean yellow Start Game button (no ugly outer box) */}
                            {isLatestAccepted && (
                                <div className="flex justify-center mt-1">
                                    {startedGameId !== gameId ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStartedGameId(gameId);
                                                onStartGame(gameId);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-black/80 border-2 border-amber-400 text-amber-300 font-pixelify text-sm uppercase tracking-wide shadow-[0_0_12px_rgba(245,158,11,0.6)] hover:brightness-125 transition-all rounded"
                                        >
                                            <PacManIcon className="w-5 h-5" />
                                            Start Game
                                        </button>
                                    ) : (
                                        <span className="font-vt323 text-gray-400 text-base uppercase tracking-wide">Game started</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <div className={`flex flex-col max-w-[80%] min-w-0 ${isOwn ? 'self-end items-end' : 'self-start items-start'}`} key={message.id}>
                        <span className={`font-vt323 text-sm uppercase tracking-wide mb-1 ${isOwn ? 'text-pacova-pink' : 'text-pacova-green'}`}>
                            {isOwn ? 'You' : selectedFriend.username}
                        </span>

                        <div className={`px-4 py-2 pixel-corners-3step font-vt323 text-lg break-words [overflow-wrap:anywhere] max-w-full ${isOwn ? 'bg-pacova-pink-dark/40 text-white' : 'bg-pacova-green-dark/40 text-white'}`}>
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
                );
            })}

            {isTyping && (
                <div className="flex flex-col max-w-[80%] min-w-0 self-start items-start">
                    <span className="font-vt323 text-sm uppercase tracking-wide mb-1 text-pacova-green">
                        {selectedFriend.username}
                    </span>
                    <div className="px-4 py-3 pixel-corners-3step bg-pacova-green-dark/40 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-pacova-green pixel-corners-3step animate-pulse" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-pacova-green pixel-corners-3step animate-pulse" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-pacova-green pixel-corners-3step animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}