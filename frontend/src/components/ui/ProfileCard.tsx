import React from 'react';
import PixelButton from './PixelButton';
import Card from './Card';

interface ProfileCardProps {
  username?: string;
  statusText?: string;
  level?: number;
  currentXp?: number;
  maxXp?: number;
  avatarUrl?: string; // Replace with your AI SVG path later
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
    <Card variant='gray' className="w-full max-w-xl">
      {/* 1. CIRCULAR NEON AVATAR */}
      <div className="relative my-4">
        <div className="w-36 h-36 rounded-full border-4 border-pacova-pink shadow-neon-pink flex items-center justify-center overflow-hidden bg-black/60">
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          ) : (
            /* Temporary Emoji Placeholder */
            <span className="text-6xl select-none">👤</span>
          )}
        </div>
      </div>

      {/* 2. USER DETAILS & LEVEL BADGE */}
      <h2 className="font-pixelify text-3xl tracking-wider uppercase text-white mt-2">
        {username}
      </h2>
      <p className="font-vt323 text-lg text-pacova-pink mb-3">{statusText}</p>

      {/* Level Tag */}
      <div className="border border-pacova-pink px-6 py-1 rounded-full bg-pacova-pink/10 font-pixelify text-sm text-pacova-pink shadow-neon-pink mb-4">
        LEVEL {level}
      </div>

      {/* 3. XP PROGRESS BAR */}
      <div className="w-full space-y-1 mb-6">
        <div className="w-full h-3 bg-gray-900 border border-pacova-pink/40 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-pacova-pink rounded-full shadow-neon-pink transition-all duration-500"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
        <p className="font-vt323 text-sm text-gray-400 text-center tracking-widest">
          {currentXp} / {maxXp} XP
        </p>
      </div>

      {/* 4. PLAYER STATS LIST */}
      <div className="w-full space-y-3 font-vt323 text-xl text-gray-300 mb-6 px-2">
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
          <span className="flex items-center gap-2">🎮 MATCHES PLAYED</span>
          <span className="text-white font-bold">{stats.matchesPlayed}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
          <span className="flex items-center gap-2">🏆 WINS</span>
          <span className="text-white font-bold">{stats.wins}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
          <span className="flex items-center gap-2">👾 LOSSES</span>
          <span className="text-white font-bold">{stats.losses}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
          <span className="flex items-center gap-2">📈 WIN RATE</span>
          <span className="text-pacova-green font-bold">{stats.winRate}%</span>
        </div>
      </div>

      {/* 5. EDIT PROFILE BUTTON */}
      <PixelButton variant="outline-magenta" size="sm" className="w-full">
        EDIT PROFILE
      </PixelButton>
    </Card>
  );
};

export default ProfileCard;