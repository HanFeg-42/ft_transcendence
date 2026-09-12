import React from 'react';

interface NavbarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab = 'HOME', 
  onSelectTab 
}) => {
  const navItems = ['HOME', 'PROFILE', 'CHAT', 'NOTIFICATION', 'SETTINGS'];

  return (
    <nav className="w-full px-8 py-4 flex justify-between items-center bg-pacova-surface/80 border-b-2 border-pacova-pink shadow-neon-pink">
      {/* Logo Pacova */}
      <div className="flex items-center gap-2 cursor-pointer">
        <span className="font-press-start text-pacova-pink text-xl drop-shadow-glow-pink">
          PACOVA
        </span>
      </div>

      {/* Liens de Navigation */}
      <div className="flex gap-6 font-vt323 text-2xl">
        {navItems.map((item) => {
          const isActive = activeTab === item;
          return (
            <button
              key={item}
              onClick={() => onSelectTab && onSelectTab(item)}
              className={`
                uppercase cursor-pointer transition-all
                ${isActive 
                  ? 'text-pacova-pink drop-shadow-glow-pink border-b-2 border-pacova-pink' 
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              {item}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;