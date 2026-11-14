
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';

import championImg from '../../assets/achievement/champion.png';
import cherrysImg from '../../assets/achievement/cherrys.png';
import ghostHanterImg from '../../assets/achievement/ghost-hanter.png';
import pacManiacImg from '../../assets/achievement/pac-maniac.png';

const ACHIEVEMENT_IMAGES: Record<string, string> = {
  champion: championImg,
  'ghost-hunter': ghostHanterImg,
  'cherry-collector': cherrysImg,
  'pac-maniac': pacManiacImg,
};

const ACHIEVEMENT_STYLES: Record<string, { border: string; text: string }> = {
  champion: { border: 'border-yellow-400!', text: 'text-amber-400' },
  'ghost-hunter': { border: 'border-pink-500!', text: 'text-pink-500' },
  'cherry-collector': { border: 'border-red-500!', text: 'text-red-500' },
  'pac-maniac': { border: 'border-cyan-400!', text: 'text-cyan-400' },
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

export default function Achievements({
  achievements,
}: AchievementsProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col gap-4 mt-4">
      <span className="font-pixelify text-xl text-pacova-pink uppercase tracking-widest block pl-1">
        {t('userProfile_achievements')}
      </span>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {achievements.map((item) => {
          const title = t(
            `userProfile_achievement_${item.id}_title`,
            { defaultValue: item.title }
          );

          const description = t(
            `userProfile_achievement_${item.id}_description`,
            { defaultValue: item.description }
          );

          const style = ACHIEVEMENT_STYLES[item.id];
        const borderColor = style?.border ?? item.borderColor;
        const textColor = style?.text ?? item.textColor;

          return (
            <Card
              key={item.id}
              variant="gray"
              className={`group flex flex-col items-center justify-between text-center p-4
                bg-pacova-surface/80 border
                ${item.unlocked ? borderColor : 'border-white/5 opacity-60'}
                transform hover:scale-105 transition-all duration-300 ease-out
                min-h-[190px] cursor-pointer`}
            >
              <div className="w-full flex-1 flex items-center justify-center mb-2">
                <img
                  src={ACHIEVEMENT_IMAGES[item.id] ?? item.image}
                  alt={title}
                  className={`w-20 h-20 sm:w-24 sm:h-24 object-contain image-rendering-pixelated
                    ${item.unlocked ? '' : 'grayscale opacity-50'}
                    group-hover:scale-110 transition-transform duration-300`}
                />
              </div>

              <div className="w-full space-y-1.5 mt-auto">
                <h4
                  className={`font-pixelify text-xs sm:text-sm font-bold uppercase tracking-wider
                    ${item.unlocked ? textColor : 'text-gray-500'}`}
                >
                  {title}
                </h4>

                <p className="font-vt323 text-xs sm:text-sm text-gray-300 leading-tight tracking-wide px-1">
                  {description}
                </p>

                {!item.unlocked && (
                  <div className="w-full bg-black/60 rounded-full h-1.5 mt-2">
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
