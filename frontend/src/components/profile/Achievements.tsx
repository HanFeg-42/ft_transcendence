import Card from '../ui/Card';

import championImg from '../../assets/achievement/champion.png';
import cherrysImg from '../../assets/achievement/cherrys.png';
import ghostHanterImg from '../../assets/achievement/ghost-hanter.png';
import pacManiacImg from '../../assets/achievement/pac-maniac.png';
import speederImg from '../../assets/achievement/speeder.png';
import tournamentImg from '../../assets/achievement/tournament.png';

const ACHIEVEMENT_IMAGES: Record<string, string> = {
  'champion': championImg,
  'ghost-hunter': ghostHanterImg,
  'cherry-collector': cherrysImg,
  'speedster': speederImg,
  'pac-maniac': pacManiacImg,
  'tournament-player': tournamentImg,
};

export interface Achievement {
  id: string;
  title: string;
  description: string;
  image: string;
  borderColor: string;
  textColor: string;
  unlocked: boolean;
  progress: number;
}

interface AchievementsProps {
  achievements: Achievement[];
}

export default function Achievements({ achievements }: AchievementsProps) {
  return (
    <div className="w-full flex flex-col gap-4 mt-4">
      <span className="font-pixelify text-xl text-pacova-pink uppercase tracking-widest block pl-1">
        ▼ ACHIEVEMENTS
      </span>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {achievements.map((item) => (
          <Card
            key={item.id}
            variant="gray"
            className={`group flex flex-col items-center justify-between text-center p-4 
                      bg-pacova-surface/80 border 
                      ${item.unlocked ? item.borderColor : 'border-white/5 opacity-60'}
                      transform hover:scale-105 transition-all duration-300 ease-out 
                      min-h-[190px] cursor-pointer`}
          >
            <div className="w-full flex-1 flex items-center justify-center mb-2">
              <img
                src={ACHIEVEMENT_IMAGES[item.id]}
                alt={item.title}
                className={`w-20 h-20 sm:w-24 sm:h-24 object-contain image-rendering-pixelated
                          ${item.unlocked ? '' : 'grayscale opacity-50'}
                          group-hover:scale-110 transition-transform duration-300`}
              />
            </div>

            <div className="w-full space-y-1.5 mt-auto">
              <h4 className={`font-pixelify text-xs sm:text-sm font-bold uppercase tracking-wider 
                            ${item.unlocked ? item.textColor : 'text-gray-500'}`}>
                {item.title}
              </h4>
              <p className="font-vt323 text-xs sm:text-sm text-gray-300 leading-tight tracking-wide px-1">
                {item.description}
              </p>

              {item.progress > 0 && !item.unlocked && (
                <div className="w-full bg-black/60 rounded-full h-1.5 mt-2">
                  <div
                    className="h-full bg-pacova-green rounded-full transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}