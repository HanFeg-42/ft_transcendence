import React from 'react';
import PixelButton from '../ui/PixelButton';
import Card from '../ui/Card';
import { Link } from 'react-router-dom';


interface ProfileCardProps {
  username?: string;
  statusText?: string;
  bio?: string;
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
  onEditClick?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  username = 'NOUSS',
  statusText = 'Ready to play',
  bio,
  level = 1,
  currentXp = 0,
  maxXp = 500,
  avatarUrl,
  stats = { matchesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
  onEditClick,
}) => {
  const xpPercentage = Math.min(100, Math.round((currentXp / maxXp) * 100));

  return (
    <Card
      variant="green"
      className="w-full h-full flex flex-col items-center p-6 md:p-8 bg-pacova-surface/60 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center w-full mt-4 flex-none">
        <div className="relative mb-6 flex justify-center">
          <div className="w-36 h-36 rounded-full border-2 border-pacova-green shadow-[0_0_25px_rgba(142,214,3,0.7)] flex items-center justify-center overflow-hidden bg-black/60">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl select-none">👤</span>
            )}
          </div>
        </div>

        <h2 className="font-pixelify text-3xl tracking-widest uppercase text-white mt-2 text-center">
          {username}
        </h2>
        <p className="font-vt323 text-lg text-pacova-green mb-2 text-center tracking-widest uppercase animate-pulse motion-reduce:transition-none">
          {statusText}
        </p>

        {bio && (
          <p className="font-vt323 text-sm text-gray-300 mb-4 text-center tracking-wide px-4 max-w-full">
            {bio}
          </p>
        )}

        <div className="border border-pacova-green/40 px-6 py-1 rounded-full bg-pacova-green/10 font-pixelify text-xs text-pacova-green shadow-[0_0_25px_rgba(142,214,3,0.7)] mb-6 inline-block">
          LEVEL {level}
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col justify-center my-8 space-y-8 max-w-[90%]">
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

        <div className="w-full space-y-4 font-vt323 text-xl text-gray-300">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 tracking-wider">🎮 MATCHES PLAYED</span>
            <span className="text-white font-bold text-2xl">{stats.matchesPlayed}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 tracking-wider">🏅 WINS</span>
            <span className="text-white font-bold text-2xl">{stats.wins}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 tracking-wider">☠️ LOSSES</span>
            <span className="text-white font-bold text-2xl">{stats.losses}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 tracking-wider">🎖 WIN RATE</span>
            <span className="text-pacova-green font-bold text-2xl drop-shadow-[0_0_8px_rgba(142,214,3,0.6)]">
              {stats.winRate}%
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <Link to="/friends" >
            <span className="text-gray-400 tracking-wider">👤 FREINDS </span> 
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full pt-4 mt-auto max-w-[90%] mb-2">
        {onEditClick && (
          <PixelButton
            variant="olive-yellow"
            size="sm"
            className="w-full py-3 text-base tracking-widest"
            onClick={onEditClick}
          >
            EDIT PROFILE
          </PixelButton>
        )}
      </div>
    </Card>
  );
};

export default ProfileCard;