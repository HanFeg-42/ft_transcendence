import React from 'react';
// import { ICONS, type IconName } from '../utils/icons';
import { ICONS, type IconName } from '../../utils/icons';

interface AvatarProps {
  iconName?: IconName;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
};

const iconSizes = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

export const Avatar: React.FC<AvatarProps> = ({
  iconName = 'packmann',
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
        {/* Render icon image from ICONS map */}
        <img
          src={ICONS[iconName]}
          alt={iconName}
          className={`${iconSizes[size]} object-contain image-rendering-pixelated`}
        />
      </div>

      {/* Status Indicator */}
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