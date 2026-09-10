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
    variant === 'pink' ? 'shadow-neon-pink' : 
    variant === 'green' ? 'shadow-neon-green' : 'shadow-none'; // ou votre classe d'ombre pour gris

  return (
    <div className={`
      relative
      bg-pacova-surface
      border-0
      ${borderStyle}
      ${glowStyle}
      p-6
      text-white
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