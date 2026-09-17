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
  const { isConnected, messages, sendMessage } = useChatSocket(
    user && token ? `wss://localhost/api/chat/ws?token=${token}` : '',
    user ? Number(user.id) : 0
  );
  const [selectedFriend, setSelectedFriend] = useState(MOCK_FRIENDS[0]);
  const [draft, setDraft] = useState('');

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) navigate(path);
  };

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(selectedFriend.id, draft.trim());
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

      <main className="flex-1 min-h-0 h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] max-w-6xl mx-auto w-full p-6 flex gap-6 overflow-hidden">
        <div className="w-80 min-h-0 flex flex-col gap-4 bg-pacova-surface/80 border-2 border-pacova-green-dark rounded-lg p-5 overflow-hidden">
          <h2 className="font-pixelify text-pacova-green text-lg uppercase tracking-wider mb-1 text-center">
            Friends
          </h2>

          <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
            {MOCK_FRIENDS.map((friend) => {
              const isSelected = friend.id === selectedFriend.id;
              return (
                <button
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md border-2 transition-all text-left ${
                    isSelected
                      ? friend.status === 'offline'
                        ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.75)]'
                        : 'border-pacova-green shadow-neon-green'
                      : 'border-transparent hover:border-pacova-gray'
                  }`}
                >
                  <Avatar iconName={friend.icon} size="sm" status={friend.status} />
                  <span className="font-vt323 text-white text-lg uppercase truncate flex-1">
                    {friend.username}
                  </span>
                  <span
                    className={`w-3 h-3 rounded-full ${
                      friend.status === 'online'
                        ? 'bg-pacova-green-dark shadow-[0_0_8px_#8ED603]'
                        : friend.status === 'busy'
                          ? 'bg-pacova-pink-dark shadow-[0_0_8px_#F32077]'
                          : 'bg-pacova-gray'
                    }`}
                    aria-label={friend.status}
                  />
                </button>
              );
            })}
          </div>

          <PixelButton type="button" variant="outline-green" size="sm" className="w-full mt-auto" onClick={() => undefined}>
            <span className="inline-flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5.2l-2.8 3-2.8-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 4v2h2V8H6Zm5 0v2h2V8h-2Zm5 0v2h2V8h-2Z" />
              </svg>
              New Chat
            </span>
          </PixelButton>
        </div>

        <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-pacova-surface/80 border-2 border-pacova-green-dark rounded-lg overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b-2 border-pacova-green">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar iconName={selectedFriend.icon} size="sm" status={selectedFriend.status} />
              <div className="min-w-0">
                <span className="font-pixelify text-white text-lg uppercase block truncate">
                  {selectedFriend.username}
                </span>
                <span className="font-vt323 text-pacova-green-dark text-base uppercase tracking-wide">
                  Online
                </span>
              </div>
            </div>
            <Badge variant={isConnected ? 'green' : 'red'}>
              {isConnected ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="flex-1 min-h-0 flex flex-col gap-4 p-5 overflow-y-auto overscroll-contain">
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
                    className={`px-4 py-2 pixel-corners-3step font-vt323 text-lg ${
                      isOwn
                        ? 'bg-pacova-pink-dark/40 text-white'
                        : 'bg-pacova-green-dark/40 text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 p-4 border-t-2 border-pacova-green">
            <div className="flex-1 min-w-0">
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
        </section>
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