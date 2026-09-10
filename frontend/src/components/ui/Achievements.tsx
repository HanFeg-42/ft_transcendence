import React from 'react';
import Card from './Card';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji temporaire
  borderColor: string;
  textColor: string;
}

const defaultBadges: Achievement[] = [
  { id: '1', title: 'CHAMPION', description: 'Win 100 matches', icon: '🏆', borderColor: 'border-amber-400', textColor: 'text-amber-400' },
  { id: '2', title: 'GHOST HUNTER', description: 'Defeat 50 ghosts', icon: '👻', borderColor: 'border-pink-500', textColor: 'text-pink-500' },
  { id: '3', title: 'CHERRY COLLECTOR', description: 'Collect 200 cherries', icon: '🍒', borderColor: 'border-red-500', textColor: 'text-red-500' },
  { id: '4', title: 'SPEEDSTER', description: 'Win 10 matches in a row', icon: '⚡', borderColor: 'border-yellow-400', textColor: 'text-yellow-400' },
  { id: '5', title: 'PAC-MANIAC', description: 'Play 500 matches', icon: '🟡', borderColor: 'border-cyan-400', textColor: 'text-cyan-400' },
  { id: '6', title: 'TOURNAMENT PLAYER', description: 'Join 10 tournaments', icon: '🔮', borderColor: 'border-purple-500', textColor: 'text-purple-500' },
];

export const Achievements: React.FC = () => {
  return (
    <Card variant="pink" className="w-full">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {defaultBadges.map((badge) => (
          <div
            key={badge.id}
            className={`flex flex-col items-center justify-between p-3 bg-black/60 border ${badge.borderColor} pixel-corners-3step text-center h-36`}
          >
            <span className="text-3xl my-1 select-none">{badge.icon}</span>
            <div>
              <h4 className={`font-pixelify text-xs ${badge.textColor} leading-tight`}>
                {badge.title}
              </h4>
              <p className="font-vt323 text-[10px] text-gray-400 mt-1 leading-tight">
                {badge.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Achievements;