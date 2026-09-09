import React from 'react';
import PixelIcon, { type PixelIconName } from './PixelIcon';

interface AvatarProps {
  iconName?: PixelIconName;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
};

export const Avatar: React.FC<AvatarProps> = ({
  iconName = 'pacman',
  size = 'md',
  status = 'online',
  className = '',
}) => {
  const statusColors = {
    online: 'bg-pacova-green shadow-neon-green',
    offline: 'bg-gray-500',
    busy: 'bg-red-500 drop-shadow-glow-red',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Container */}
      <div className={`
        ${sizeClasses[size]} 
        bg-pacova-surface 
        border-2 
        border-pacova-pink 
        shadow-neon-pink 
        pixel-corners-3step 
        flex items-center justify-center 
        overflow-hidden
      `}>
        <PixelIcon name={iconName} size={size === 'lg' ? 48 : size === 'md' ? 32 : 20} />
      </div>

      {/* Status Dot */}
      {status && (
        <span className={`
          absolute -bottom-1 -right-1 
          w-3.5 h-3.5 
          border-2 border-black 
          ${statusColors[status]}
        `} />
      )}
    </div>
  );
};

export default Avatar;