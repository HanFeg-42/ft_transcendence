import type { Friend } from "./types";
import { useState } from "react";


interface ConversationHeaderProps{
  friend: Friend;
}


export default function ConversationHeader({friend}: ConversationHeaderProps)
{
    const [menuOpen, setMenuOpen] = useState<boolean>(false);


    return (
        <div className="flex justify-between items-center bg-red-800">
          {/* Left side: Username and Status grouped together */}
          <div>
            <div>{friend.username}</div>
            <div className={`${friend.status === 'online' ? "text-green-500" : "text-gray-400"}`}>
              {friend.status === 'online' ? 'online' : 'offline'}
            </div>
          </div>

            {/* Right side: Three-dots menu button and dropdown */}
            <div className="relative" >
                <button aria-label="Menu" onClick={() => setMenuOpen(true)}>⋮</button>
                {menuOpen && (<div className="absolute right-0 top-full mt-1 z-10 bg-gray-800 border border-gray-700 p-2 rounded-md">
                  <button onClick={() => setMenuOpen(false)}>✕</button>
                  <button>View Profile</button>
                </div>)}
            </div>
      
            
        </div>
    )
}