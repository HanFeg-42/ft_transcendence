import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'pink' | 'green' | 'gray';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'pink',
  className = '',
}) => {
  const borderStyle = 
    variant === 'pink' ? 'border-pacova-pink/50' : 
    variant === 'green' ? 'border-pacova-green/50' : 'border-pacova-gray';

  const glowStyle = 
    variant === 'pink' ? 'drop-shadow-[0_0_12px_rgba(243,32,119,0.5)]' : 
    variant === 'green' ? 'drop-shadow-[0_0_12px_rgba(142,214,3,0.5)]' :
    variant === 'gray' ? 'drop-shadow-[0_0_12px_#00000080]' : '';

  // Applique le texte noir pour 'gray', sinon reste blanc
  const textStyle = variant === 'gray' ? 'text-black' : 'text-white';

  return (
    <div className={`
      relative
      w-full
      h-full
      flex
      flex-col
      justify-between
      bg-pacova-surface
      border-1
      ${borderStyle}
      ${glowStyle}
      ${textStyle}
      p-4 sm:p-5 md:p-6
      rounded-xl
      overflow-hidden
      transition-all
      ${className}
    `}>
      {/* Effet d'écran rétro */}
      <span className="absolute inset-0 pixel-scanlines pointer-events-none" />
      
      {/* Contenu à l'intérieur de la carte */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Card;
