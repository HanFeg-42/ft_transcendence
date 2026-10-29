// import { useEffect, useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Avatar } from '../../components/ui/Avatar';
// import PixelButton from '../../components/ui/PixelButton';
// import { ICONS } from '../../utils/icons';
// import { NO_GLOW, type Friend } from './helpers';
// import { useTranslation } from "react-i18next";



// export function PacManIcon({ className = '', flip = false }: { className?: string; flip?: boolean }) {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       className={className}
//       style={flip ? { transform: 'scaleX(-1)' } : undefined}
//       fill="#FFD400"
//       aria-hidden="true"
//     >
//       <path d="M12 12 L20.66 7 A10 10 0 1 0 20.66 17 Z" />
//     </svg>
//   );
// }

// /* ------------------------------ Sidebar ------------------------------ */

// export function Sidebar({ friends, selectedId, onSelect, onNewChat, open }: {
//   friends: Friend[];
//   selectedId: number;
//   onSelect: (id: number) => void;
//   onNewChat: () => void;
//   open: boolean;
// }) {
//   const { t } = useTranslation();
//   return (
//     <div className={`${open ? 'flex fixed inset-x-4 top-24 bottom-4 z-40' : 'hidden'} md:flex md:static md:w-[22rem] shrink-0 min-h-0 flex-col bg-pacova-surface border-2 border-pacova-green-dark rounded-lg overflow-hidden`}>
//     {/* <div className="w-[22rem] shrink-0 min-h-0 flex flex-col bg-pacova-surface border-2 border-pacova-green-dark rounded-lg overflow-hidden"> */}
//       <h2 className="font-pixelify text-pacova-green text-2xl uppercase tracking-wider text-center px-5 h-20 flex items-center justify-center gap-4 border-b-2 border-pacova-green-dark">
//         <PacManIcon className="w-7 h-7 shrink-0" />
//         {t('chat_friends')}
//         <PacManIcon className="w-7 h-7 shrink-0" flip />
//       </h2>

//       <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0 p-4">
//         {friends.map((friend) => (
//           <button
//             key={friend.id}
//             onClick={() => onSelect(friend.id)}
//             className={`flex items-center gap-3 px-3 py-3 rounded-md border-2 transition-colors text-start ${NO_GLOW} ${
//               friend.id === selectedId
//                 ? friend.status === 'offline' ? 'border-gray-500' : 'border-pacova-green'
//                 : 'border-transparent hover:border-pacova-gray'
//             }`} 
//           >
//             <span className="rounded-full overflow-hidden ring-2 ring-pacova-green-dark/60 shrink-0">
//               {friend.avatar ? (
//               <img 
//                 src={friend.avatar}
//                 alt={t('chat_avatarAlt', { username: friend.username })}
//                 className="w-10 h-10 object-cover"
//               />) : (<Avatar iconName={'packmann'} size="sm" />)
//               }
//             </span>
//             <span className="font-vt323 text-white text-lg uppercase truncate flex-1">{friend.username}</span>
//             <span
//               className={`w-3 h-3 rounded-full shrink-0 ${friend.status === 'online' ? 'bg-pacova-green' : 'bg-gray-500'}`}
//               aria-label={friend.status}
//             />
//           </button>
//         ))}
//       </div>

//       <div className="mt-auto h-[76px] px-4 flex items-center border-t-2 border-pacova-green-dark">
//         <PixelButton type="button" variant="outline-green" size="lg" className={`w-full ${NO_GLOW}`} onClick={onNewChat}>
//           <span className="inline-flex items-center justify-center gap-2">
//             <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
//               <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5.2l-2.8 3-2.8-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 4v2h2V8H6Zm5 0v2h2V8h-2Zm5 0v2h2V8h-2Z" />
//             </svg>
//             {t('chat_newChat')}
//           </span>
//         </PixelButton>
//       </div>
//     </div>
//   );
// }

// /* ------------------------------ Header ------------------------------- */

// // Render with key={friend.id} so the menu resets when the friend changes.
// export function Header({ friend, blocked, onToggleBlock, onInvite, inviteDisabled, onToggleFriends }: {
//   friend: Friend;
//   blocked: boolean;
//   onToggleBlock: () => void;
//   onInvite: () => void;
//   inviteDisabled: boolean;
//   onToggleFriends: () => void;
// }) {
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const [menu, setMenu] = useState<'closed' | 'open' | 'confirm'>('closed');
//   const menuRef = useRef<HTMLDivElement>(null);

//   // Close the menu on outside click or Escape.
//   useEffect(() => {
//     if (menu === 'closed') return;
//     const onDown = (e: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu('closed');
//     };
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') setMenu('closed');
//     };
//     document.addEventListener('mousedown', onDown);
//     document.addEventListener('keydown', onKey);
//     return () => {
//       document.removeEventListener('mousedown', onDown);
//       document.removeEventListener('keydown', onKey);
//     };
//   }, [menu]);

//   return (
//     <div className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 md:px-5 h-20 border-b-2 border-pacova-green-dark relative">
//     {/* <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 h-20 border-b-2 border-pacova-green-dark relative"> */}
//       <div className="flex items-center gap-3 min-w-0">


//             {/* 2. new: the 3 lines button (mobile only) */}
//           <button
//             type="button"
//             onClick={onToggleFriends}
//             aria-label={t('chat_friends')}
//             className={`md:hidden p-1 text-pacova-green shrink-0 ${NO_GLOW}`}
//           >
//             <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
//               <rect x="3" y="5" width="18" height="2.5" />
//               <rect x="3" y="10.75" width="18" height="2.5" />
//               <rect x="3" y="16.5" width="18" height="2.5" />
//             </svg>
//           </button>

//         <span className="rounded-full overflow-hidden ring-2 ring-pacova-green-dark/60 shrink-0">
//           {friend.avatar ? (
//               <img 
//                 src={friend.avatar}
//                 alt={t('chat_avatarAlt', { username: friend.username })}
//                 className="w-10 h-10 object-cover"
//               />) : (<Avatar iconName={'packmann'} size="sm" />)
//           }
//         </span>
//         <div className="min-w-0">
//           <span className="font-pixelify text-white text-lg uppercase block truncate">{friend.username}</span>
//           <span className={`font-vt323 text-base uppercase tracking-wide ${friend.status === 'online' ? 'text-pacova-green' : 'text-gray-500'}`}>
//             {friend.status === 'online' ? t('chat_online') : t('chat_offline')}
//           </span>
//         </div>
//       </div>

//       <button
//         type="button"
//         onClick={onInvite}
//         disabled={inviteDisabled}
//         aria-label={t('chat_inviteToPlay')}
//         className="justify-self-center flex items-center gap-2 px-2 md:px-4 py-1.5 rounded-full border-2 border-amber-400/70 bg-black/60 font-pixelify text-amber-300 text-sm uppercase tracking-wide shadow-[0_0_10px_rgba(245,158,11,0.5)] hover:brightness-125 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
//       >
//         <PacManIcon className="w-5 h-5" />
//           <span className="hidden md:inline">{t('chat_inviteToPlay')}</span>
//       </button>



//       <div ref={menuRef} className="relative justify-self-end">
//         <button
//           className={`p-2 rounded-md text-pacova-green hover:bg-pacova-green/10 transition-colors ${NO_GLOW}`}
//           aria-label={t('chat_menu')}
//           onClick={() => setMenu('open')}
//         >
//           <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor" aria-hidden="true">
//             <circle cx="5" cy="12" r="2" />
//             <circle cx="12" cy="12" r="2" />
//             <circle cx="19" cy="12" r="2" />
//           </svg>
//         </button>

//         {menu !== 'closed' && (
//           <div role="menu" className="absolute end-0 top-full mt-2 w-56 max-w-[calc(100vw-3rem)] bg-pacova-surface border-2 border-pacova-green-dark rounded-lg z-20 overflow-hidden">

//             {menu === 'open' ? (
//               <ul className="relative py-1">
//                 <li>
//                   <button
//                     type="button"
//                     role="menuitem"
//                     disabled={blocked}
//                     onClick={() => navigate(`/profile/${friend.id}`)}
//                     className="w-full text-start px-4 py-2 font-vt323 text-lg md:text-xl uppercase truncate text-pacova-green hover:bg-pacova-green/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
//                   >
//                     {t('chat_viewProfile')}
//                   </button>
//                 </li>
//                 <li>
//                   <button
//                     type="button"
//                     role="menuitem"
//                     onClick={() => setMenu('confirm')}
//                     className="w-full text-start px-4 py-2 font-vt323 text-lg md:text-xl uppercase truncate text-red-500 hover:bg-red-500/10"
//                   >
//                     {blocked ? t('chat_unblock', { username: friend.username }) : t('chat_block', { username: friend.username })}
//                   </button>
//                 </li>
//               </ul>
//             ) : (
//               <div className="relative p-4 flex flex-col items-center gap-3">
//                 <p className="font-vt323 text-white text-lg text-center uppercase">
//                   {blocked ? t('chat_unblockConfirm') : t('chat_blockConfirm')}
//                 </p>
//                 <div className="flex gap-3">
//                   <PixelButton
//                     variant="danger-red"
//                     size="sm"
//                     onClick={async () => {
//                       await onToggleBlock();
//                       setMenu('closed');
//                     }}
//                   >
//                     {t('chat_yes')}
//                   </PixelButton>
//                   <PixelButton variant="outline-green" size="sm" onClick={() => setMenu('open')}>
//                     {t('chat_no')}
//                   </PixelButton>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /* ----------------------------- New chat ------------------------------ */

// // Render only while open ({open && <NewChatModal .../>}) so the search resets by itself.
// export function NewChatModal({ friends, onSelect, onClose }: {
//   friends: Friend[];
//   onSelect: (id: number) => void;
//   onClose: () => void;
// }) {
//   const { t } = useTranslation();
//   const [query, setQuery] = useState('');
//   const matches = friends.filter((f) => f.username.toLowerCase().includes(query.toLowerCase()));

//   return (
//     <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
//       <div className="w-full max-w-lg p-6 flex flex-col gap-4 bg-pacova-surface pixel-scanlines border-2 border-pacova-pink shadow-neon-pink pixel-corners-3step">
//         <h3 className="pb-3 border-b border-pacova-pink/40 text-center font-pixelify text-2xl text-pacova-pink uppercase">
//           {t('chat_newChat')}
//         </h3>

//         <input
//           type="text"
//           autoFocus
//           placeholder={t('chat_searchUsername')}
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           className="px-3 py-2 bg-black/60 border border-gray-700 focus:border-pacova-pink rounded-md outline-none font-vt323 text-lg text-white"
//         />

//         <div className="flex flex-col gap-2 max-h-72 overflow-y-auto font-vt323 text-lg">
//           {matches.length === 0 && <p className="py-6 text-center text-gray-500">	{t('chat_noMatches')}</p>}
//           {matches.map((friend) => (
//             <button
//               key={friend.id}
//               className="flex items-center gap-3 px-3 py-2 rounded-md border-2 border-transparent hover:border-pacova-pink text-start text-white uppercase"
//               onClick={() => {
//                 onSelect(friend.id);
//                 onClose();
//               }}
//             >
//               <span className="rounded-full overflow-hidden ring-2 ring-pacova-green-dark/60 shrink-0">
//                 {friend.avatar ? (
//                     <img 
//                       src={friend.avatar}
//                       alt={t('chat_avatarAlt', { username: friend.username })}
//                       className="w-10 h-10 object-cover"
//                     />) : (<Avatar iconName={'packmann'} size="sm" />)
//                 }
//               </span>
//               {friend.username}
//             </button>
//           ))}
//         </div>

//         <div className="flex justify-end">
//           <PixelButton variant="outline-green" size="sm" onClick={onClose}>
//             {t('chat_close')}
//           </PixelButton>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* --------------------------- Game invitation -------------------------- */

// const GHOSTS: Array<keyof typeof ICONS> = ['gost-red', 'gost-pink', 'gost-blue', 'gost-orange'];

// // receiver=true  -> "X invited you" (Accept / Decline)
// // receiver=false -> "Invite X"      (Send / Cancel)
// export function GameInviteModal({ name, receiver = false, onYes, onNo }: {
//   name: string;
//   receiver?: boolean;
//   onYes: () => void;
//   onNo: () => void;
// }) {
//   const { t } = useTranslation();
//   return (
//     <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
//       <div className="relative bg-pacova-surface border-2 border-pacova-green shadow-neon-green pixel-corners-3step max-w-sm w-full p-6 text-center">
//         <span className="absolute inset-0 pixel-scanlines pointer-events-none" />

//         <div className="relative z-10 flex flex-col items-center gap-4">
//           <div className="w-16 h-16 rounded-full bg-black/60 border-2 border-pacova-green flex items-center justify-center">
//             <PacManIcon className="w-9 h-9" />
//           </div>

//           <h3 className="font-pixelify text-pacova-green text-xl uppercase tracking-wide">{t('chat_gameInvitation')}</h3>

//           <p className="font-vt323 text-lg text-gray-200">
//             <span className="text-white break-all">
//               {receiver ? t('chat_invitedYou', { name }) : t('chat_inviteTo', { name })}
//             </span>
//             <br />
//             <span className="font-pixelify text-2xl text-pacova-green">Pacova</span>
//           </p>

//           <div className="flex flex-wrap justify-center gap-2">
//             {GHOSTS.map((g) => (
//               <img key={g} src={ICONS[g]} alt="" className="w-8 h-8 image-rendering-pixelated" />
//             ))}
//           </div>

//           <p className="font-vt323 text-gray-400 text-base">{t('chat_readyGhosts')}</p>

//           <div className="flex gap-3 mt-1">
//             <PixelButton variant="filled-green" size="md" onClick={onYes}>
//               {receiver ? t('chat_accept') : t('chat_send')}
//             </PixelButton>
//             <PixelButton variant="outline-magenta" size="md" onClick={onNo}>
//               {receiver ? t('chat_decline') : t('chat_cancel')}
//             </PixelButton>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }