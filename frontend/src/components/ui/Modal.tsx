import React from 'react';
import PixelButton from './PixelButton';

interface ModalProps {
  isOpen: boolean;           // Dit si la modal est ouverte ou fermée
  onClose: () => void;       // Fonction pour fermer la modal
  title: string;             // Titre de la modal
  children: React.ReactNode; // Contenu à l'intérieur
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Si isOpen est faux, on ne rendu RIEN (null)
  if (!isOpen) return null;

  return (
    // Backdrop : Fond sombre semi-transparent qui couvre tout l'écran
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      
      {/* Conteneur principal de la Modal */}
      <div className="bg-pacova-surface border-2 border-pacova-pink shadow-neon-pink pixel-corners-3step max-w-lg w-full p-6 text-white relative">
        
        {/* Overlay pour l'effet CRT */}
        <span className="absolute inset-0 pixel-scanlines pointer-events-none" />

        {/* En-tête : Titre + Bouton de fermeture */}
        <div className="flex items-center justify-between border-b border-pacova-pink/40 pb-3 mb-4 relative z-10">
          <h3 className="font-pixelify text-2xl text-pacova-pink uppercase tracking-wide">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white font-pixelify text-xl cursor-pointer"
          >
            [X]
          </button>
        </div>

        {/* Corps de la Modal */}
        <div className="font-vt323 text-xl text-gray-200 relative z-10 mb-6">
          {children}
        </div>

        {/* Pied de la Modal : Action pour fermer */}
        <div className="flex justify-end relative z-10">
          <PixelButton variant="outline-magenta" size="sm" onClick={onClose}>
            CLOSE
          </PixelButton>
        </div>

      </div>
    </div>
  );
};

export default Modal;