import React from "react";
import { useNotifications } from "../../context/NotificationContext";

interface NavbarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = "HOME",
  onSelectTab,
}) => {
  const navItems = ["HOME", "PROFILE", "CHAT", "NOTIFICATION", "SETTINGS"];
  const { unreadCount } = useNotifications();

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
                ${
                  isActive
                    ? "text-pacova-pink drop-shadow-glow-pink border-b-2 border-pacova-pink"
                    : "text-gray-400 hover:text-white"
                }
              `}
            >
              <span className="flex items-center gap-2">
                {item}

                {item === "NOTIFICATION" && unreadCount > 0 && (
                  <span className="min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-pacova-pink text-black text-sm font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
