import React from 'react';

// Options pour personnaliser la carte
interface CardProps {
  children: React.ReactNode; // Tout ce qu'on mettra à l'intérieur de la carte
  variant?: 'pink' | 'green' | 'gray'; // Permet de choisir entre la version Rose et la version Verte
  className?: string; // Pour ajouter du style personnalisé si besoin
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'pink',
  className = '',
}) => {
  // Sélection des styles selon la variante choisie
  const borderStyle = 
    variant === 'pink' ? 'border-pacova-pink/40' : 
    variant === 'green' ? 'border-pacova-green' : 'border-pacova-gray';

  const glowStyle = 
variant === 'pink' ? 'drop-shadow-[0_0_12px_rgba(243,32,119,0.5)]' : 
  variant === 'green' ? 'drop-shadow-[0_0_12px_rgba(142,214,3,0.5)]' : '';
  return (
    <div className={`
      relative
      bg-pacova-surface
      border-0
      ${borderStyle}
      ${glowStyle}
      p-6
      text-white
      rounded-xl
      overflow-hidden
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