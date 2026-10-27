
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Card from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import {
  getMatchHistory,
  type MatchHistoryItem,
} from '../../services/matchService';
import { getProfileById } from '../../services/userService';

import packman3d from '../../assets/icons/packman3d.png';
import gostRed from '../../assets/icons/gost-red.png';
import gostBlue from '../../assets/icons/gost-blue.png';
import gostOrange from '../../assets/icons/gost-orange.png';
import gostPurple from '../../assets/icons/gost-purple.png';
import gostPink from '../../assets/icons/gost-pink.png';

interface Match {
  id: string;
  result: string;
  score: string;
  opponent: string;
  time: string;
  opponentColor?: 'red' | 'blue' | 'orange' | 'purple' | 'pink';
}

interface MatchHistoryProps {
  userId?: string;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({
  userId,
}) => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadMatchHistory = async () => {
      setLoading(true);

      try {
        const list: Match[] = [];
        const rows: MatchHistoryItem[] = await getMatchHistory(
          token,
          userId
        );

        for (const row of rows) {
          const opponent = row.match.participants.find(
            (p) => p.userId !== row.userId
          );

          if (!opponent) continue;

          const opponentProfile = await getProfileById(
            token,
            opponent.userId
          );

          const locale =
            i18n.language === 'fr'
              ? 'fr-FR'
              : i18n.language === 'ar'
                ? 'ar'
                : 'en-US';

          list.push({
            id: row.id,
            result: row.result ?? '',
            score: `${row.score} - ${opponent.score}`,
            opponent: opponentProfile.username,
            time: new Date(row.match.startedAt).toLocaleDateString(
              locale
            ),
          });
        }

        if (!cancelled) {
          setMatches(list);
        }
      } catch (error) {
        console.error('[MATCH-HISTORY] Failed to load:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMatchHistory();

    return () => {
      cancelled = true;
    };
  }, [token, userId, i18n.language]);

  const getMatchIcon = (match: Match) => {
    if (match.result === 'WIN') return packman3d;

    switch (match.opponentColor) {
      case 'red':
        return gostRed;
      case 'blue':
        return gostBlue;
      case 'orange':
        return gostOrange;
      case 'purple':
        return gostPurple;
      case 'pink':
        return gostPink;
      default:
        return gostRed;
    }
  };

  const getTranslatedResult = (result: string) => {
    if (result === 'WIN') {
      return t('userProfile_matchWin');
    }

    if (result === 'LOSS' || result === 'LOSE') {
      return t('userProfile_matchLoss');
    }

    // Préserve les résultats inconnus au lieu de les masquer.
    return result;
  };

  return (
    <Card
      variant="gray"
      className="w-full h-full p-5 bg-pacova-surface/60 backdrop-blur-sm flex flex-col justify-between"
    >
      <div className="w-full mb-4">
        <span className="font-pixelify text-xl text-pacova-green uppercase tracking-widest block pl-1">
          {t('userProfile_matchHistory')}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between font-vt323 text-xl tracking-wider text-gray-300">
        {loading ? (
          <span className="text-gray-500 text-sm">
            {t('userProfile_loadingMatches')}
          </span>
        ) : matches.length === 0 ? (
          <span className="text-gray-500 text-sm">
            {t('userProfile_noMatches')}
          </span>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="flex items-center justify-between border-b border-white/5 pb-2.5 pt-1.5 last:border-none last:pb-0"
            >
              <div className="w-16 sm:w-20">
                <span
                  className={`font-bold uppercase ${
                    match.result === 'WIN'
                      ? 'text-pacova-green'
                      : 'text-red-500'
                  }`}
                >
                  {getTranslatedResult(match.result)}
                </span>
              </div>

              <div className="flex items-center justify-center w-12">
                <img
                  src={getMatchIcon(match)}
                  alt={getTranslatedResult(match.result)}
                  className="w-9 h-9 object-contain"
                />
              </div>

              <div className="w-30 text-center font-bold text-white text-xl">
                {match.score}
              </div>

              <div className="w-28 sm:w-36 text-left text-gray-400 font-sans text-xs uppercase">
                {t('userProfile_vs', { opponent: match.opponent })}
              </div>

              <div className="text-right text-gray-500 text-sm font-sans min-w-[70px]">
                {match.time}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default MatchHistory;
