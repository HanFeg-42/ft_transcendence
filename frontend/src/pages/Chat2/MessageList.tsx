import type { Friend, Message } from './types';
import { formatMessageTimestamp } from './formatTimestamp'


interface MessageListProps{
    conversation: Message[];
    selectedFriend: Friend;
    currentUserId: number;
		loading: boolean;
		error: string | null;
}


export default function MessageList(
	{conversation, selectedFriend, currentUserId, loading, error} : MessageListProps)
{
  if(error)
		return <p>{error}</p>
	if(loading)
		return <p>Loading...</p>
  if(conversation.length === 0)
    return <p>No messages yet</p>

  return (
    <div className='flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 p-4'>
      {conversation.map((message) => {
          const isOwn = message.sender_id === currentUserId;
                      
          return (
					<div className={`flex w-full  ${isOwn ? "justify-end" : "justify-start"}`} 
								key={message.id}>
						<div className={`px-3 py-2 rounded-md max-w-[70%]  ${isOwn ? " bg-blue-600 text-white" : "bg-gray-700 text-white"}`} >
							{isOwn ? 'you' : selectedFriend.username}
						<div>{message.content}</div>
						<div>{formatMessageTimestamp(message.created_at)}</div>
						</div>
					</div>
      )})}
    </div>
  )
}