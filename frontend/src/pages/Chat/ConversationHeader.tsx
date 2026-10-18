import type { Friend } from "./types";
import { useState, useRef, useEffect } from "react";
import { Avatar } from '../../components/ui/Avatar';
import { NO_GLOW } from './constants';
import PixelButton from '../../components/ui/PixelButton';
import PacManIcon from './PacManIcon';
import { useNavigate } from 'react-router-dom';



interface ConversationHeaderProps{
  friend: Friend;
  iBlockedThem: boolean;
  toggleBlock: () => void;
  onInviteClick: () => void;
  inviteDisabled: boolean;
}


export default function ConversationHeader({
  friend, 
  iBlockedThem, 
  toggleBlock,
  onInviteClick,
  inviteDisabled}: ConversationHeaderProps)
{
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [confirmMode, setConfirmMode] = useState<'block' | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();


    const closeMenu = () => {
      setMenuOpen(false);
      setConfirmMode(null);
    };
      // Close on outside click or Escape.
    useEffect(() => {
      if (!menuOpen) return;
  
      function handlePointerDown(event: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          closeMenu();
        }
      }
      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') closeMenu();
      }
  
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [menuOpen]);

    // Friend switched while the menu was open
    useEffect(() => {closeMenu();}, [friend.id]);

    const handleViewProfile = () => {
      navigate(`/profile/${friend.id}`);
      closeMenu();
    };



    return (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 h-20 border-b-2 border-pacova-green-dark relative">
          {/* Left side: Username and Status grouped together */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="rounded-full overflow-hidden ring-2 ring-pacova-green-dark/60 shrink-0">
                <Avatar iconName={"gost-pink-3d"} size="sm" />
            </span>
            <div className="min-w-0">
              <span className="font-pixelify text-white text-lg uppercase block truncate">
              {friend.username}
              </span>
              <span
              className={`font-vt323 text-base uppercase tracking-wide ${
              friend.status === 'online' ? 'text-pacova-green' : 'text-gray-500'
            }`}
          >
            {friend.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>


            <button
              type="button"
              onClick={onInviteClick}
              disabled={inviteDisabled}
              className={`justify-self-center flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-amber-400/70 bg-black/60 font-pixelify text-amber-300 text-sm uppercase tracking-wide shadow-[0_0_10px_rgba(245,158,11,0.5)] hover:brightness-125 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${NO_GLOW ? '' : ''}`}
            >
              <PacManIcon className="w-5 h-5" />
              Invite to Play
            </button>


            {/* Right side: Three-dots menu button and dropdown */}
            <div ref={menuRef} className="relative justify-self-end">
                <button 
                className={`p-2 rounded-md text-pacova-green hover:bg-pacova-green/10 transition-colors ${NO_GLOW}`}
                aria-label="Menu" onClick={() => setMenuOpen(true)}
                >
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor" aria-hidden="true">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>

              
                {menuOpen && (
                  <div 
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-64 bg-pacova-surface border-2 border-pacova-green-dark rounded-lg z-20 overflow-hidden">
                  {/* <button onClick={() => setMenuOpen(false)}>✕</button> */}
                  
                  {!confirmMode ? (
                    <ul className="relative py-1">
                      <li>
                      <button 
                      type="button"
                      role="menuitem"
                      onClick={handleViewProfile}
                      className="w-full text-left px-4 py-2 font-vt323 text-xl uppercase text-pacova-green hover:bg-pacova-green/10"
                      >View Profile</button>
                      </li>

                      <li>
                      <button 
                      type="button"
                      role="menuitem"
                      className="w-full text-left px-4 py-2 font-vt323 text-xl uppercase text-red-500 hover:bg-red-500/10"
                      onClick={() => setConfirmMode('block')}>
                          {iBlockedThem ? "Unblock" : "Block"} {friend.username}
                      </button>
                      </li>
                    </ul>
                  ) : 
                  
                  
                  (
                        <div className="relative p-4 flex flex-col items-center gap-3">
                          <p
                          className="font-vt323 text-white text-lg text-center uppercase">
                            {iBlockedThem ? "Unblock this user?" : "Block this user?"}
                          </p>
                          <div className="flex gap-3">
                            <PixelButton variant="danger-red" size="sm" onClick={async () => {
                                await toggleBlock();
                                setConfirmMode(null);
                                setMenuOpen(false);
                            }}>Yes</PixelButton>

                            <PixelButton variant="outline-green" size="sm" onClick={() => setConfirmMode(null)}>
                              No
                            </PixelButton>
                          </div>
                        </div>
                  )}
                </div>)}
            </div>
      
            
        </div>
    )
}