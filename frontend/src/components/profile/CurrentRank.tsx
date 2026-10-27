
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import { ICONS } from '../../utils/icons';

interface CurrentRankProps {
  rank: number;
  totalPlayers: number;
  wins: number;
}

export default function CurrentRank({
  rank,
  totalPlayers,
  wins,
}: CurrentRankProps) {
  const { t } = useTranslation();

  const isRanked = rank > 0 && totalPlayers > 0;
  const percentage = isRanked
    ? Math.round((rank / totalPlayers) * 100)
    : 0;

  const getBadge = () => {
    if (!isRanked) {
      return {
        name: t('userProfile_unranked'),
        color: 'text-gray-400',
        icon: ICONS.diamond,
      };
    }

    if (percentage <= 10) {
      return {
        name: t('userProfile_diamond'),
        color: 'text-cyan-400',
        icon: ICONS.diamond,
      };
    }

    if (percentage <= 25) {
      return {
        name: t('userProfile_gold'),
        color: 'text-yellow-400',
        icon: ICONS.diamond,
      };
    }

    if (percentage <= 50) {
      return {
        name: t('userProfile_silver'),
        color: 'text-gray-300',
        icon: ICONS.diamond,
      };
    }

    return {
      name: t('userProfile_bronze'),
      color: 'text-amber-600',
      icon: ICONS.diamond,
    };
  };

  const badge = getBadge();

  return (
    <Card
      variant="gray"
      className="w-full h-full flex flex-col justify-between items-center text-center p-5 bg-pacova-surface/60 backdrop-blur-sm"
    >
      <span className="font-pixelify text-xl text-pacova-green uppercase tracking-widest self-start">
        {t('userProfile_currentRank')}
      </span>

      <div className="my-auto flex flex-col items-center gap-2 py-4">
        <img
          src={badge.icon}
          alt={badge.name}
          className="w-20 h-20 object-contain image-rendering-pixelated drop-shadow-[0_0_15px_rgba(243,32,119,0.6)] animate-pulse motion-reduce:transition-none"
        />

        <h3
          className={`font-pixelify text-xl uppercase tracking-wide drop-shadow-[0_0_8px_rgba(142,214,3,0.4)] ${badge.color}`}
        >
          {badge.name}
        </h3>

        <span className="font-vt323 text-sm text-gray-400 tracking-wider">
          {isRanked
            ? t('userProfile_rankPosition', { rank, totalPlayers })
            : t('userProfile_playToRank')}
        </span>

        <span className="font-vt323 text-xs text-gray-500 tracking-wider">
          {t('userProfile_winsCount', { count: wins })}
        </span>
      </div>

      <div className="w-full space-y-1">
        <div className="w-full h-2.5 bg-black/60 border border-pacova-green/30 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-pacova-green rounded-full shadow-[0_0_8px_rgba(142,214,3,0.8)] transition-all duration-500"
            style={{ width: `${isRanked ? 100 - percentage : 0}%` }}
          />
        </div>

        <span className="font-vt323 text-xs text-gray-400 block text-right">
          {isRanked
            ? t('userProfile_topPercentage', { percentage })
            : '—'}
        </span>
      </div>
    </Card>
  );
}
