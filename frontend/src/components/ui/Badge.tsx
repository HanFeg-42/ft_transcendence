import React from 'react';

// Options pour configurer notre Badge
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pink' | 'green' | 'yellow' | 'red';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'pink',
}) => {
  // Mapping des couleurs de bordure et de texte
  const variantStyles = {
    pink: 'border-pacova-pink text-pacova-pink shadow-neon-pink',
    green: 'border-pacova-green text-pacova-green shadow-neon-green',
    yellow: 'border-amber-400 text-amber-400 drop-shadow-glow-yellow',
    red: 'border-red-500 text-red-500 drop-shadow-glow-red',
  };

  return (
    <span className={`
      inline-block
      bg-pacova-surface
      border-2
      px-3
      py-1
      font-pixelify
      text-sm
      uppercase
      tracking-wider
      pixel-corners-3step
      ${variantStyles[variant]}
    `}>
      {children}
    </span>
  );
};

export default Badge;