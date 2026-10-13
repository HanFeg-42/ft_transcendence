import type { Friend, Message } from './types';
import { formatMessageTimestamp } from './formatTimestamp'
import type { RefObject } from 'react';
import { NEON_SCROLLBAR } from '../Chat/constants';
// import PacManIcon from '../Chat/PacManIcon';
// import { ICONS } from '../../utils/icons';



interface MessageListProps{
    conversation: Message[];
    selectedFriend: Friend;
    currentUserId: number;
		loading: boolean;
		error: string | null;
    messagesEndRef: RefObject<HTMLDivElement | null>;
}


export default function MessageList(
	{conversation, 
  selectedFriend,
  currentUserId,
  loading,
  error,
  messagesEndRef
} : MessageListProps){
  
  if(error)
		return <p className="font-vt323 text-red-500 text-lg text-center mt-8">{error}</p>
	if(loading)
		return <p className="font-vt323 text-gray-600 text-lg text-center mt-8">Loading...</p>
  if(conversation.length === 0)
    return <p className="font-vt323 text-gray-600 text-lg text-center mt-8">No messages yet</p>

  return (
    <div className={`flex-1 min-h-0 flex flex-col gap-4 p-5 overflow-y-auto overflow-x-hidden overscroll-contain ${NEON_SCROLLBAR}`}>
      {conversation.map((message) => {
          const isOwn = message.sender_id === currentUserId;
                      
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
                {formatMessageTimestamp(message.created_at)}</span>
					  </div>
      )})}
      <div ref={messagesEndRef} />
    </div>
  )
}