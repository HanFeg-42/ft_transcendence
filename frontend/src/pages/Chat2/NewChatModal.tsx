import type { Friend } from "./types";
import { useState } from 'react';
import PixelButton from '../../components/ui/PixelButton';
import { Avatar } from '../../components/ui/Avatar';


interface NewChatModalProps{
    isOpen: boolean;
    onClose: () => void;
    friends: Friend[];
    onSelectFriend: (friend: Friend) => void;
}


export default function NewChatModal({ 
isOpen, 
onClose, 
friends, 
onSelectFriend }: NewChatModalProps) 
{
    const [query, setQuery] = useState("");
    if (!isOpen) return null;
    

    const filteredFriends = friends.filter(friend => 
        friend.username.toLowerCase().includes(query.toLowerCase()));


    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">

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
            

            {filteredFriends.length === 0 &&
                <p className="py-6 text-center text-gray-500">No matches.</p>}
                {filteredFriends.map((friend) => (
                    <button 
                    className="flex items-center gap-3 px-3 py-2 rounded-md border-2 border-transparent hover:border-pacova-pink text-left text-white uppercase"
                    key={friend.id} 
                    onClick={() => {onSelectFriend(friend); 
                    setQuery(""); 
                    onClose();}}>
                        <Avatar iconName={"packman-blue-3d"} size="sm" status={friend.status} />
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