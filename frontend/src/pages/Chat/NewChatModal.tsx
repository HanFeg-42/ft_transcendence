// import { useMemo, useState } from 'react';
// import PixelButton from '../../components/ui/PixelButton';
// import { Avatar } from '../../components/ui/Avatar';
// import type { Friend } from './types';

// interface NewChatModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   friends: Friend[];
//   onSelectFriend: (friend: Friend) => void;
// }

// // NOTE: there's no real user-search endpoint yet (needs a small public
// // lookup on the auth service, or user_db once that's built) — for now this
// // only lets you jump to someone already in your friends list.
// //
// // This does NOT reuse the shared components/ui/Modal.tsx — that file
// // belongs to a teammate and isn't touched. This is its own small modal
// // shell instead, styled to match (border, scanlines, pixel corners), just
// // with a centered title, no [X], and a green close button.
// export default function NewChatModal({ isOpen, onClose, friends, onSelectFriend }: NewChatModalProps) {
//   const [query, setQuery] = useState('');

//   const results = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     if (!q) return friends;
//     return friends.filter((friend) => friend.username.toLowerCase().includes(q));
//   }, [friends, query]);

//   const handlePick = (friend: Friend) => {
//     onSelectFriend(friend);
//     setQuery('');
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
//       <div className="bg-pacova-surface border-2 border-pacova-pink shadow-neon-pink pixel-corners-3step max-w-lg w-full p-6 text-white relative">
//         <span className="absolute inset-0 pixel-scanlines pointer-events-none" />

//         {/* Centered title, no [X] — the only visual difference from the shared Modal */}
//         <div className="flex items-center justify-center border-b border-pacova-pink/40 pb-3 mb-4 relative z-10">
//           <h3 className="font-pixelify text-2xl text-pacova-pink uppercase tracking-wide">New Chat</h3>
//         </div>

//         <div className="font-vt323 text-xl text-gray-200 relative z-10 mb-6">
//           <div className="flex flex-col gap-4">
//             <input
//               type="text"
//               autoFocus
//               placeholder="Search username..."
//               value={query}
//               onChange={(event) => setQuery(event.target.value)}
//               className="w-full bg-black/60 border border-gray-700 focus:border-pacova-pink text-white font-vt323 text-lg px-3 py-2 rounded-md outline-none"
//             />

//             <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
//               {results.length === 0 && (
//                 <p className="font-vt323 text-gray-500 text-lg text-center py-6">No matches.</p>
//               )}
//               {results.map((friend) => (
//                 <button
//                   key={friend.id}
//                   type="button"
//                   onClick={() => handlePick(friend)}
//                   className="flex items-center gap-3 px-3 py-2 rounded-md border-2 border-transparent hover:border-pacova-pink transition-colors text-left"
//                 >
//                   <Avatar iconName={friend.icon} size="sm" status={friend.status} />
//                   <span className="font-vt323 text-white text-lg uppercase truncate">{friend.username}</span>
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Green close button, as asked — not the shared Modal's magenta default */}
//         <div className="flex justify-end relative z-10">
//           <PixelButton variant="outline-green" size="sm" onClick={onClose}>
//             CLOSE
//           </PixelButton>
//         </div>
//       </div>
//     </div>
//   );
// }








import { useState } from 'react';
import PixelButton from '../../components/ui/PixelButton';
import { Avatar } from '../../components/ui/Avatar';
import type { Friend } from './types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  onSelectFriend: (friend: Friend) => void;
}

// Popup to jump to a friend. It only searches your friends list
// (there is no user-search endpoint yet).
export default function NewChatModal({ isOpen, onClose, friends, onSelectFriend }: NewChatModalProps) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  // Case-insensitive, partial match. Empty query shows everyone.
  const results = friends.filter((friend) =>
    friend.username.toLowerCase().includes(query.trim().toLowerCase())
  );

  function handlePick(friend: Friend) {
    onSelectFriend(friend);
    setQuery('');
    onClose();
  }

  return (
    // dark full-screen overlay, centers the card
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      {/* the card: same border, glow, pixel corners and scanlines as before */}
      <div className="w-full max-w-lg p-6 flex flex-col gap-4 bg-pacova-surface pixel-scanlines border-2 border-pacova-pink shadow-neon-pink pixel-corners-3step">
        <h3 className="pb-3 border-b border-pacova-pink/40 text-center font-pixelify text-2xl text-pacova-pink uppercase">
          New Chat
        </h3>

        <input
          type="text"
          autoFocus
          placeholder="Search username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-3 py-2 bg-black/60 border border-gray-700 focus:border-pacova-pink rounded-md outline-none font-vt323 text-lg text-white"
        />

        {/* scrolls when there are many friends */}
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto font-vt323 text-lg">
          {results.length === 0 && <p className="py-6 text-center text-gray-500">No matches.</p>}
          {results.map((friend) => (
            <button
              key={friend.id}
              type="button"
              onClick={() => handlePick(friend)}
              className="flex items-center gap-3 px-3 py-2 rounded-md border-2 border-transparent hover:border-pacova-pink text-left text-white uppercase"
            >
              <Avatar iconName={friend.icon} size="sm" status={friend.status} />
              {friend.username}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <PixelButton variant="outline-green" size="sm" onClick={onClose}>
            CLOSE
          </PixelButton>
        </div>
      </div>
    </div>
  );
}