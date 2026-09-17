import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatSocket } from '../hooks/useChatSocket';
import Background from '../components/ui/Background';
import Navbar from '../components/ui/Navbar';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import PixelButton from '../components/ui/PixelButton';
import type { ChatMessageIncoming } from '../../../shared/types/chat-types';
import type { IconName } from '../utils/icons';

const MOCK_FRIENDS: { id: number; username: string; icon: IconName; status: 'online' | 'offline' | 'busy' }[] = [
  { id: 2, username: 'malika22', icon: 'gost-pink', status: 'online' },
  { id: 3, username: 'hanane', icon: 'gost-red', status: 'online' },
  { id: 4, username: 'yassine', icon: 'gost-blue', status: 'offline' },
];

const routeMap: Record<string, string> = {
  HOME: '/home',
  PROFILE: '/profile',
  CHAT: '/chat',
  NOTIFICATION: '/notifications',
  SETTINGS: '/settings',
};

export default function Chat() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { isConnected, sendMessage } = useChatSocket(
    user && token ? `wss://localhost/api/chat/ws?token=${token}` : '',
    user ? Number(user.id) : 0
  );
  const [selectedFriend, setSelectedFriend] = useState(MOCK_FRIENDS[0]);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessageIncoming[]>([]);

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) navigate(path);
  };

  const handleSend = () => {
    if (!draft.trim() || !user) return;

    const content = draft.trim();
    sendMessage(selectedFriend.id, content);
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        sender_id: user.id,
        receiver_id: selectedFriend.id,
        content,
        created_at: new Date().toISOString(),
      },
    ]);
    setDraft('');
  };

  if (!user || !token) {
    return (
      <Background>
        <Navbar activeTab="CHAT" onSelectTab={handleSelectTab} />
        <main className="flex-1 flex items-center justify-center">
          <h1 className="font-pixelify text-pacova-pink text-3xl uppercase">Loading...</h1>
        </main>
      </Background>
    );
  }

  const conversation = messages.filter(
    (message) => message.sender_id === selectedFriend.id || message.receiver_id === selectedFriend.id
  );

  return (
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={handleSelectTab} />

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 flex gap-4">
        <div className="w-64 flex flex-col gap-3 bg-pacova-surface/80 border-2 border-pacova-green shadow-neon-green rounded-lg p-4">
          <h2 className="font-pixelify text-pacova-green text-lg uppercase tracking-wider mb-1">
            Friends
          </h2>

          {MOCK_FRIENDS.map((friend) => {
            const isSelected = friend.id === selectedFriend.id;
            return (
              <button
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md border-2 transition-all text-left ${
                  isSelected
                    ? 'border-pacova-green shadow-neon-green'
                    : 'border-transparent hover:border-pacova-gray'
                }`}
              >
                <Avatar iconName={friend.icon} size="sm" status={friend.status} />
                <span className="font-vt323 text-white text-lg uppercase truncate">
                  {friend.username}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col bg-pacova-surface/80 border-2 border-pacova-green shadow-neon-green rounded-lg overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b-2 border-pacova-green">
            <div className="flex items-center gap-3">
              <Avatar iconName={selectedFriend.icon} size="sm" status={selectedFriend.status} />
              <span className="font-pixelify text-white text-lg uppercase">
                {selectedFriend.username}
              </span>
            </div>
            <Badge variant={isConnected ? 'green' : 'red'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
            {conversation.length === 0 && (
              <p className="font-vt323 text-gray-600 text-lg text-center mt-8">No messages yet</p>
            )}
            {conversation.map((message) => {
              const isOwn = message.sender_id === user.id;
              return (
                <div
                  key={message.id}
                  className={`flex flex-col max-w-[70%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <span className="font-vt323 text-pacova-green text-sm uppercase tracking-wide mb-1">
                    {isOwn ? 'You' : selectedFriend.username}{' '}
                    <span className="text-gray-500 normal-case">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </span>
                  <div className="px-4 py-2 border-2 border-pacova-green pixel-corners-3step bg-pacova-bg text-white font-vt323 text-lg">
                    {message.content}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 p-4 border-t-2 border-pacova-green">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Type message..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                className="border-pacova-green focus:shadow-neon-green"
              />
            </div>
            <PixelButton type="button" variant="filled-green" size="sm" onClick={handleSend}>
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                  <path d="M21.7 3.3a1 1 0 0 0-1.03-.24l-18 6a1 1 0 0 0 .08 1.92l7.26 1.82 1.82 7.26a1 1 0 0 0 .91.76h.06a1 1 0 0 0 .9-.57l6-18a1 1 0 0 0 0-1.95ZM4.6 10.1l12.1-4.03-6.04 6.04L4.6 10.1Zm7.96 7.96-1.04-4.16 6.04-6.04-5 10.2Z" />
                </svg>
                Send
              </span>
            </PixelButton>
          </div>
        </div>
      </main>
    </Background>
  );
}




// import { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useChatSocket } from '../hooks/useChatSocket';
// import { Card } from '../components/ui/Card';
// import { Input } from '../components/ui/Input';
// import { Badge } from '../components/ui/Badge';
// import Button from '../components/ui/Button';

// export default function Chat() {
//   const { token, user } = useAuth();

//   // Hooks must run unconditionally — pass a safe "not ready" value instead
//   // of early-returning before the hook call. The hook itself skips opening
//   // a socket when url is empty.
//   const { isConnected, messages, sendMessage } = useChatSocket(
//     user && token ? `wss://localhost/api/chat/ws?token=${token}` : '',
//     user ? Number(user.id) : 0
//   );

//   // TEMP: manual recipient input, until the user service exists to pick
//   // from a real contacts/friends list.
//   const [receiverId, setReceiverId] = useState('');
//   const [draft, setDraft] = useState('');

//   if (!user || !token) {
//     return (
//       <div className="flex-1 flex items-center justify-center">
//         <h1 className="font-pixelify text-pacova-pink text-3xl uppercase">
//           Loading...
//         </h1>
//       </div>
//     );
//   }

//   function handleSend() {
//     if (!receiverId || !draft.trim()) return;
//     sendMessage(Number(receiverId), draft.trim());
//     setDraft('');
//   }

//   const conversation = messages.filter(
//     (m) =>
//       String(m.sender_id) === receiverId || String(m.receiver_id) === receiverId
//   );

//   return (
//     <div className="flex-1 flex justify-center items-center p-6">
//       <Card variant="pink" className="w-full max-w-xl flex flex-col gap-4">
//         <div className="flex items-center justify-between gap-3">
//           <h1 className="font-pixelify text-pacova-pink text-2xl uppercase">
//             Chat
//           </h1>
//           <Badge variant={isConnected ? 'green' : 'red'}>
//             {isConnected ? 'Connected' : 'Disconnected'}
//           </Badge>
//         </div>

//         {/* TEMP: replace with a real contacts list once user service exists */}
//         <Input
//           type="number"
//           label="Chat with user ID"
//           placeholder="e.g. 3"
//           value={receiverId}
//           onChange={(e) => setReceiverId(e.target.value)}
//         />

//         <div className="flex flex-col gap-2 h-80 overflow-y-auto bg-pacova-bg rounded-md p-3">
//           {conversation.length === 0 && (
//             <p className="font-vt323 text-gray-600 text-lg text-center mt-8">
//               No messages yet
//             </p>
//           )}
//           {conversation.map((m) => (
//             <div
//               key={m.id}
//               className={`max-w-[75%] px-3 py-2 rounded-md font-vt323 text-lg ${
//                 m.sender_id === user.id
//                   ? 'self-end bg-pacova-pink-dark text-white'
//                   : 'self-start bg-pacova-surface border border-pacova-gray text-white'
//               }`}
//             >
//               <p>{m.content}</p>
//               <span className="block text-xs text-gray-400 mt-1">
//                 {new Date(m.created_at).toLocaleTimeString()}
//               </span>
//             </div>
//           ))}
//         </div>

//         <div className="flex gap-2">
//           <Input
//             type="text"
//             placeholder="Type a message..."
//             value={draft}
//             onChange={(e) => setDraft(e.target.value)}
//             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//           />
//           <Button variant="pink" styleType="filled" onClick={handleSend}>
//             Send
//           </Button>
//         </div>
//       </Card>
//     </div>
//   );
// }




// import { useChatSocket } from '../hooks/useChatSocket';
// import { useAuth } from "../context/AuthContext";
// import { useState } from 'react';

// export default function ChatPage() {
//   const { token, user } = useAuth();

//   // Hooks must run unconditionally — pass a safe "not ready" value instead
//   // of early-returning before the hook call. The hook itself skips opening
//   // a socket when url is empty (see the `if (!url) return;` guard in it).
//   const { isConnected, messages, sendMessage } = useChatSocket(
//     user && token ? `wss://localhost/api/chat/ws?token=${token}` : '',
//     user ? Number(user.id) : 0
//   );

//   // TEMP: manual recipient input, until the user service exists to pick
//   // from a real contacts/friends list.
//   const [receiverId, setReceiverId] = useState('');
//   const [draft, setDraft] = useState('');

//   if (!user || !token) {
//     return <p>Loading auth...</p>;
//   }

//   function handleSend() {
//     if (!receiverId || !draft.trim()) return;
//     sendMessage(Number(receiverId), draft.trim());
//     setDraft('');
//   }

//   return (
//     <div className="chat-page">
//       <div className="chat-header">
//         <span className={`connection-badge ${isConnected ? 'online' : 'offline'}`}>
//           {isConnected ? 'Connected' : 'Disconnected'}
//         </span>

//         {/* TEMP: replace with a real contacts list once user service exists */}
//         <input
//           type="number"
//           placeholder="Chat with user ID"
//           value={receiverId}
//           onChange={(e) => setReceiverId(e.target.value)}
//         />
//       </div>

//       <div className="message-list">
//         {messages
//           .filter(
//             (m) =>
//               String(m.sender_id) === receiverId ||
//               String(m.receiver_id) === receiverId
//           )
//           .map((m) => (
//             <div
//               key={m.id}
//               className={`message-bubble ${m.sender_id === user.id ? 'own' : 'received'}`}
//             >
//               <p>{m.content}</p>
//               <span className="timestamp">
//                 {new Date(m.created_at).toLocaleTimeString()}
//               </span>
//             </div>
//           ))}
//       </div>

//       <div className="message-input-bar">
//         <input
//           type="text"
//           placeholder="Type a message..."
//           value={draft}
//           onChange={(e) => setDraft(e.target.value)}
//           onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//         />
//         <button onClick={handleSend}>Send</button>
//       </div>
//     </div>
//   );
// }