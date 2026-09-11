import React from 'react';
import Card from './Card';
import { ICONS, type IconName } from '../../utils/icons';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: IconName; // Uses your exact IconName union type
  borderColor: string;
  textColor: string;
}

const defaultBadges: Achievement[] = [
  { id: '1', title: 'CHAMPION', description: 'Win 100 matches', iconName: 'champion', borderColor: 'border-amber-400', textColor: 'text-amber-400' },
  { id: '2', title: 'GHOST HUNTER', description: 'Defeat 50 ghosts', iconName: 'gost-pink-3d', borderColor: 'border-pink-500', textColor: 'text-pink-500' },
  { id: '3', title: 'CHERRY COLLECTOR', description: 'Collect 200 cherries', iconName: 'cherry3d', borderColor: 'border-red-500', textColor: 'text-red-500' },
  { id: '4', title: 'SPEEDSTER', description: 'Win 10 matches in a row', iconName: 'speed3d', borderColor: 'border-yellow-400', textColor: 'text-yellow-400' },
  { id: '5', title: 'PAC-MANIAC', description: 'Play 500 matches', iconName: 'packman-blue-3d', borderColor: 'border-cyan-400', textColor: 'text-cyan-400' },
  { id: '6', title: 'TOURNAMENT PLAYER', description: 'Join 10 tournaments', iconName: 'start-3d', borderColor: 'border-purple-500', textColor: 'text-purple-500' },
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
            {/* Asset Icon Image Rendering */}
            <div className="w-10 h-10 my-1 flex items-center justify-center">
              <img
                src={ICONS[badge.iconName]}
                alt={badge.title}
                className="w-full h-full object-contain image-rendering-pixelated"
              />
            </div>

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