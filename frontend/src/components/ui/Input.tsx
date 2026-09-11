import React from 'react';

// Ici on définit les "options" (Props) que notre Input peut recevoir
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Un texte au-dessus du champ (ex: "EMAIL")
  error?: string; // Un message d'erreur si la saisie est incorrecte
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props // Récupère automatiquement les options HTML classiques (type, placeholder, etc.)
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* 1. Affichage du label s'il existe */}
      {label && (
        <label className="font-pixelify text-pacova-pink text-lg uppercase tracking-wide">
          {label}
        </label>
      )}
      
      {/* 2. Le Champ de texte avec nos styles pixelisés */}
      {/* <div className="relative drop-shadow-glow-gray"> */}
      <div className="relative">
        <input
          className={`
            w-full
            bg-pacova-surface
            text-white
            font-vt323
            text-2xl
            px-4
            py-2
            border-2
            rounded-md
            border-pacova-pink
            outline-none
            transition-all
            placeholder:text-gray-600
            focus:shadow-neon-pink
            disabled:opacity-40
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {/* Overlay pour l'effet de balayage écran rétro (CRT) */}
        <span className="absolute inset-0 pixel-scanlines pointer-events-none" />
      </div>

      {/* 3. Affichage du message d'erreur s'il existe */}
      {error && (
        <span className="font-vt323 text-red-500 text-lg">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;

            // pixel-corners-3step
// after 9