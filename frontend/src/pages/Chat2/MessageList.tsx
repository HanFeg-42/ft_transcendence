import type { Friend, Message } from './types';
import { formatMessageTimestamp } from './formatTimestamp'
import type { RefObject } from 'react';
import { NEON_SCROLLBAR } from '../Chat/constants';
import PacManIcon from './PacManIcon';
import { ICONS } from '../../utils/icons';
import PixelButton from '../../components/ui/PixelButton';



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


export default function MessageList(
	{conversation, 
  selectedFriend,
  currentUserId,
  loading,
  error,
  messagesEndRef,
  isTyping,
  friendReadAt,
  onStartGame
} : MessageListProps){
  
  if(error)
		return <p className="font-vt323 text-red-500 text-lg text-center mt-8">{error}</p>
	if(loading)
		return <p className="font-vt323 text-gray-600 text-lg text-center mt-8">Loading...</p>
  if(conversation.length === 0)
    return <p className="font-vt323 text-gray-600 text-lg text-center mt-8">No messages yet</p>


  // Compute the id of the last game invite message (copy array before reversing)
    const lastInviteId = [...conversation]
        .reverse()
        .find((msg) => msg.kind === 'game_invite')?.id;

  
  return (
    <div className={`flex-1 min-h-0 flex flex-col gap-4 p-5 overflow-y-auto overflow-x-hidden overscroll-contain ${NEON_SCROLLBAR}`}>
      {conversation.map((message) => {
          const isOwn = message.sender_id === currentUserId;
          const isRead = message.read_at != null || (friendReadAt != null && message.created_at <= friendReadAt);           

          if (message.kind === 'system') return null;




          // 2. Render game invites as custom rows
          if (message.kind === 'game_invite') {
              const status = message.meta?.status;
              const gameId = message.meta?.gameId;

              return (
                  <div key={message.id} className="flex justify-center my-2 w-full">
                      <div className="flex flex-col items-center gap-2 px-4 py-3 bg-pacova-surface border-2 border-pacova-green/40 pixel-corners-3step max-w-sm w-full text-center">
                          <div className="flex items-center gap-2">
                              {status === 'declined' ? (
                                  <img src={ICONS['gost-red']} alt="" className="w-6 h-6 image-rendering-pixelated" />
                              ) : (
                                  <PacManIcon className="w-6 h-6" />
                              )}
                              <span className="font-vt323 uppercase text-sm tracking-wide">
                                  {status === 'pending' && (
                                      isOwn ? "Invitation sent" : `${selectedFriend.username} invited you`
                                  )}
                                  {status === 'accepted' && (
                                      <span className="text-pacova-green">Invite accepted</span>
                                  )}
                                  {status === 'declined' && (
                                      <span className="text-red-400">Invite declined</span>
                                  )}
                              </span>
                          </div>

                          {status === 'accepted' && message.id === lastInviteId && gameId && (
                              <PixelButton 
                                  variant="filled-green" 
                                  size="sm" 
                                  onClick={() => onStartGame(gameId)}
                              >
                                  Start Game
                              </PixelButton>
                          )}
                      </div>
                  </div>
              );
          }





          return (
					<div className={`flex flex-col max-w-[80%] min-w-0 ${
          isOwn ? 'self-end items-end' : 'self-start items-start'}`} 
          
								key={message.id}>
				  		<span
              className={`font-vt323 text-sm uppercase tracking-wide mb-1 ${
              isOwn ? 'text-pacova-pink' : 'text-pacova-green'}`}>
              {isOwn ? 'You' : selectedFriend.username}
              </span>

				  		<div
              className={`px-4 py-2 pixel-corners-3step font-vt323 text-lg break-words [overflow-wrap:anywhere] max-w-full ${
              isOwn
                ? 'bg-pacova-pink-dark/40 text-white'
                : 'bg-pacova-green-dark/40 text-white'}`}>
                {message.content}</div>
				  		<span className="font-vt323 text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                {isOwn && (
                  <span className="tracking-[-2px]">
                    {isRead ? '✓✓' : '✓'}
                  </span>
                )}
                {formatMessageTimestamp(message.created_at)}</span>
					  </div>
      )})}


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

      <div ref={messagesEndRef} />
    </div>
  )
}