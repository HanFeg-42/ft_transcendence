import React from 'react';

interface GameModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

export const GameModeCard: React.FC<GameModeCardProps> = ({
  title,
  description,
  icon,
  selected = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative
        flex flex-col items-center
        p-6
        w-64
        bg-pacova-surface
        border-2
        pixel-corners-3step
        cursor-pointer
        transition-all duration-200
        hover:scale-105
        ${selected 
          ? 'border-pacova-pink shadow-neon-pink' 
          : 'border-pacova-green/60 shadow-neon-green/40 hover:border-pacova-green'
        }
      `}
    >
      {/* Effet d'écran CRT */}
      <span className="absolute inset-0 pixel-scanlines pointer-events-none" />

      {/* Icône du mode */}
      <div className="text-5xl mb-4 text-pacova-pink drop-shadow-glow-pink">
        {icon}
      </div>

      {/* Titre du mode */}
      <h3 className="font-pixelify text-2xl text-white uppercase tracking-wider mb-2">
        {title}
      </h3>

      {/* Description textuelle pixelisée */}
      <p className="font-vt323 text-lg text-gray-400 text-center leading-tight">
        {description}
      </p>
    </div>
  );
};

export default GameModeCard;