// src/components/layout/Navbar.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../context/NotificationContext";
import logo from "../../assets/icons/PACOVA-logo.png";

interface NavbarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

const NAV_ITEMS = [
  { key: "HOME",         label: "home" },
  { key: "LEADERBOARD",  label: "leaderboard" },
  { key: "PROFILE",      label: "profile" },
  { key: "CHAT",         label: "chat" },
  { key: "NOTIFICATION", label: "notification" },
  { key: "SETTINGS",     label: "settings" },
] as const;

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = "HOME",
  onSelectTab,
}) => {
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const renderLink = (item: typeof NAV_ITEMS[number]) => {
    const isActive = activeTab === item.key;
    return (
      <button
        key={item.key}
        onClick={() => {
          onSelectTab?.(item.key);
          setIsOpen(false); // ferme le menu mobile après sélection
        }}
        className={`
          uppercase cursor-pointer transition-all
          flex items-center gap-2
          font-vt323 text-2xl
          ${isActive
            ? "text-pacova-green drop-shadow-glow-green border-b-2 border-pacova-green"
            : "text-gray-400 hover:text-white"}
        `}
      >
        {t(item.label)}
        {item.key === "NOTIFICATION" && unreadCount > 0 && (
          <span className="min-w-5 h-5 px-1 flex items-center justify-center
                           rounded-full bg-pacova-green text-black text-sm font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav className="relative z-50 w-full px-4 md:px-8 py-4
                    flex items-center justify-between
                    bg-pacova-surface/40 border-b-1 border-pacova-green/60
                    shadow-neon-green/60 backdrop-blur-md">

      {/* Logo cliquable → HOME */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => onSelectTab?.("HOME")}
      >
        <img
          src={logo}
          alt="PACOVA logo"
          className="h-8 w-8 [image-rendering:pixelated]"
        />
        {/* <span className="font-press-start text-pacova-green text-xl drop-shadow-glow-green">
          PACOVA
        </span> */}
      </div>

      {/* Liens desktop — cachés sous md */}
      <div className="hidden md:flex gap-6">
        {NAV_ITEMS.map(renderLink)}
      </div>

      {/* Burger mobile — visible sous md */}
      <button
        className="md:hidden font-vt323 text-2xl text-pacova-green"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Panneau mobile */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full
                        flex flex-col gap-3 px-6 py-4
                        bg-pacova-surface border-b-2 border-pacova-green
                        md:hidden">
          {NAV_ITEMS.map(renderLink)}
        </div>
      )}
    </nav>
  );
};

export default Navbar;