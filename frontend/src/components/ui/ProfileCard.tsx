import React from 'react';
import PixelButton from './PixelButton';
import Card from './Card';

interface ProfileCardProps {
  username?: string;
  statusText?: string;
  level?: number;
  currentXp?: number;
  maxXp?: number;
  avatarUrl?: string;
  stats?: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  username = 'NOUSS',
  statusText = 'Ready to play',
  level = 24,
  currentXp = 2350,
  maxXp = 3000,
  avatarUrl,
  stats = { matchesPlayed: 243, wins: 176, losses: 67, winRate: 72 },
}) => {
  const xpPercentage = Math.min(100, Math.round((currentXp / maxXp) * 100));

  return (
    // Remplacement de variant="gray" par "green" pour conserver le thème néon rose de la bordure et du shadow de la maquette
    // Ajout d'une min-height (h-full + min-h-3xl ou similaire selon le conteneur parent) pour forcer l'étirement vertical
    <Card 
      variant="green" 
      className="w-full h-full flex flex-col items-center p-6 md:p-8 bg-pacova-surface/60 backdrop-blur-sm"
    >
      
      {/* 1. HAUT : AVATAR + PSEUDO (Poussé vers le haut avec mt-4) */}
      <div className="flex flex-col items-center w-full mt-4 flex-none">
        <div className="relative mb-6 flex justify-center">
          {/* Avatar agrandi (w-36 h-36) pour correspondre aux proportions généreuses de Figma */}
          <div className="w-36 h-36 rounded-full border-2 border-pacova-green shadow-[0_0_25px_rgba(142,214,3,0.7)] flex items-center justify-center overflow-hidden bg-black/60">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl select-none">👤</span>
            )}
          </div>
        </div>

        {/* DETAILS (Textes agrandis et espacés) */}
        <h2 className="font-pixelify text-3xl tracking-widest uppercase text-white mt-2 text-center">
          {username}
        </h2>
        <p className="font-vt323 text-lg text-pacova-green mb-4 text-center tracking-widest uppercase animate-pulse motion-reduce:transition-none">
          {statusText}
        </p>

        {/* Level Tag */}
        <div className="border border-pacova-green/40 px-6 py-1 rounded-full bg-pacova-green/10 font-pixelify text-xs text-pacova-green shadow-[0_0_10px_rgba(243,32,119,0.4)] mb-6 inline-block">
          LEVEL {level}
        </div>
      </div>

      {/* 2. MILIEU : PROGRESS BARRES & STATS (Prend tout l'espace central disponible avec flex-1) */}
      <div className="w-full flex-1 flex flex-col justify-center my-8 space-y-8 max-w-[90%]">
        
        {/* XP Progress Bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-3 bg-gray-900 border border-pacova-green/40 rounded-full overflow-hidden p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
            <div
              className="h-full bg-gradient-to-r from-pacova-green to-green-500 rounded-full shadow-[0_0_12px_rgba(243,32,119,0.9)] transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <p className="font-vt323 text-sm text-gray-400 text-center tracking-widest">
            {currentXp} / {maxXp} XP
          </p>
        </div>

        {/* Player Stats (Lignes plus espacées verticalement avec py-2 et text-xl) */}
        <div className="w-full space-y-4 font-vt323 text-xl text-gray-300">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 tracking-wider">🎮 MATCHES PLAYED</span>
            <span className="text-white font-bold text-2xl">{stats.matchesPlayed}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 tracking-wider">🏆 WINS</span>
            <span className="text-white font-bold text-2xl">{stats.wins}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 tracking-wider">👾 LOSSES</span>
            <span className="text-white font-bold text-2xl">{stats.losses}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 tracking-wider">📈 WIN RATE</span>
            <span className="text-pacova-green font-bold text-2xl drop-shadow-[0_0_8px_rgba(142,214,3,0.6)]">
              {stats.winRate}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. BAS : BOUTON ACTION (Ancré tout en bas avec mt-auto) */}
      <div className="w-full pt-4 mt-auto max-w-[90%] mb-2">
        <PixelButton variant="olive-yellow" size="sm" className="w-full py-3 text-base tracking-widest">
          EDIT PROFILE
        </PixelButton>
      </div>
      
    </Card>
  );
};

export default ProfileCard;
