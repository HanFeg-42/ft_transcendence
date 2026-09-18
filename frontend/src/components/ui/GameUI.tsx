import React from 'react';
import Card from './Card'; // Assurez-vous que le chemin est correct

// 1. IMPORTATION DE VOS ICÔNES DEPUIS LES ASSETS
import packman3d from '../../assets/icons/packman3d.png';
import gostRed from '../../assets/icons/gost-red.png';
import gostBlue from '../../assets/icons/gost-blue.png';
import gostOrange from '../../assets/icons/gost-orange.png';
import gostPurple from '../../assets/icons/gost-purple.png';
import gostPink from '../../assets/icons/gost-pink.png';

interface Match {
  id: string;
  type: 'WIN' | 'LOSS';
  score: string;
  opponent: string;
  time: string;
  opponentColor?: 'red' | 'blue' | 'orange' | 'purple' | 'pink';
}

export const GameUI: React.FC = () => {
  // Vos données d'historique basées sur la maquette Figma
  const matches: Match[] = [
    { id: '1', type: 'WIN', score: '8 - 3', opponent: 'VS HANANE', time: '2 min ago', opponentColor: 'orange' },
    { id: '2', type: 'LOSS', score: '4 - 8', opponent: 'VS OMAR', time: 'Yesterday', opponentColor: 'red' },
    { id: '3', type: 'WIN', score: '8 - 1', opponent: 'VS SARA', time: '2 days ago', opponentColor: 'pink' },
    { id: '4', type: 'WIN', score: '7 - 2', opponent: 'VS YASSINE', time: '3 days ago', opponentColor: 'blue' },
    { id: '5', type: 'LOSS', score: '5 - 7', opponent: 'VS ADIL', time: '5 days ago', opponentColor: 'purple' },
  ];

  // Fonction pour récupérer l'icône du joueur ou du fantôme adverse
  const getMatchIcon = (match: Match) => {
    if (match.type === 'WIN') {
      // Si gagné, on affiche toujours le Pac-Man 3D jaune
      return packman3d;
    }
    
    // Si perdu, on affiche le fantôme de la bonne couleur
    switch (match.opponentColor) {
      case 'red': return gostRed;
      case 'blue': return gostBlue;
      case 'orange': return gostOrange;
      case 'purple': return gostPurple;
      case 'pink': return gostPink;
      default: return gostRed;
    }
  };

  return (
    <Card variant="gray" className="w-full h-full p-5 bg-pacova-surface/60 backdrop-blur-sm flex flex-col justify-between">
      {/* Entête du tableau */}
      <div className="w-full mb-4">
        <span className="font-pixelify text-xl text-pacova-green uppercase tracking-widest block pl-1">
          ▼ MATCH HISTORY
        </span>
      </div>

      {/* Liste des matchs (Rendu ultra-propre et espacé style Figma) */}
      <div className="flex-1 flex flex-col justify-between font-vt323 text-xl tracking-wider text-gray-300">
        {matches.map((match) => (
          <div 
            key={match.id} 
            className="flex items-center justify-between border-b border-white/5 pb-2.5 pt-1.5 last:border-none last:pb-0"
          >
            {/* Colonne Statut : WIN (Vert) ou LOSS (Rouge) */}
            <div className="w-16 sm:w-20">
              <span className={`font-bold uppercase ${match.type === 'WIN' ? 'text-pacova-green drop-shadow-[0_0_6px_rgba(142,214,3,0.4)]' : 'text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]'}`}>
                {match.type}
              </span>
            </div>

            {/* Nouvelle colonne ICÔNE 3D (Remplace définitivement les cercles) */}
            <div className="flex items-center justify-center w-12">
              <img 
                src={getMatchIcon(match)} 
                alt={match.type === 'WIN' ? 'Pacman' : 'Ghost'} 
                className="w-9 h-9 object-contain image-rendering-pixelated filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* Score */}
            <div className="w-20 text-center font-bold text-white text-2xl">
              {match.score}
            </div>

            {/* Nom de l'Adversaire */}
            <div className="w-28 sm:w-36 text-left text-gray-400 font-sans text-xs tracking-normal uppercase">
              {match.opponent}
            </div>

            {/* Date / Time */}
            <div className="text-right text-gray-500 text-sm font-sans tracking-normal min-w-[70px]">
              {match.time}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default GameUI;
