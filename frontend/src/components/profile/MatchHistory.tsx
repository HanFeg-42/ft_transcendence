import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "../ui/Card";
import { useAuth } from "../../context/AuthContext";
import {
  getMatchHistory,
  type MatchHistoryItem,
} from "../../services/matchService";
import { getProfileById } from "../../services/userService";

import packman3d from "../../assets/icons/packman3d.png";
import gostRed from "../../assets/icons/gost-red.png";
import gostBlue from "../../assets/icons/gost-blue.png";
import gostOrange from "../../assets/icons/gost-orange.png";
import gostPurple from "../../assets/icons/gost-purple.png";
import gostPink from "../../assets/icons/gost-pink.png";

interface Match {
  id: string;
  result: string;
  score: string;
  opponent: string;
  time: string;
  opponentColor?: "red" | "blue" | "orange" | "purple" | "pink";
}

interface MatchHistoryProps {
  userId?: string;
}

const resultColors: Record<string, string> = {
  WIN: "text-pacova-green",
  LOSS: "text-red-500",
  DRAW: "text-yellow-400",
  ABANDONED: "text-gray-500",
};

export const MatchHistory: React.FC<MatchHistoryProps> = ({ userId }) => {
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
        const rows: MatchHistoryItem[] = await getMatchHistory(token, userId);

        for (const row of rows) {
          const opponent = row.match.participants.find(
            (p) => p.userId !== row.userId,
          );

          if (!opponent) continue;

          const opponentProfile = await getProfileById(token, opponent.userId);

          const locale =
            i18n.language === "fr"
              ? "fr-FR"
              : i18n.language === "ar"
                ? "ar"
                : "en-US";

          list.push({
            id: row.id,
            result: row.result ?? "",
            score: `${row.score} - ${opponent.score}`,
            opponent: opponentProfile.username,
            time: new Date(row.match.startedAt).toLocaleDateString(locale),
          });
        }

        if (!cancelled) {
          setMatches(list);
        }
      } catch {} 
      finally {
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
    if (match.result === "WIN") return packman3d;

    switch (match.opponentColor) {
      case "red":
        return gostRed;
      case "blue":
        return gostBlue;
      case "orange":
        return gostOrange;
      case "purple":
        return gostPurple;
      case "pink":
        return gostPink;
      default:
        return gostRed;
    }
  };

  return (
    <Card
      variant="gray"
      className="w-full min-w-0 h-full p-4 sm:p-5 bg-pacova-surface/60 backdrop-blur-sm flex flex-col justify-between"
    >
      <div className="w-full mb-3 sm:mb-4">
        <span className="font-pixelify text-lg sm:text-xl text-pacova-green uppercase tracking-widest block pl-1">
          {t("userProfile_matchHistory")}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin] [scrollbar-color:#8ed603_transparent] font-vt323 text-xl tracking-wider text-gray-300">
        {loading ? (
          <span className="text-gray-500 text-sm">
            {t("userProfile_loading")}
          </span>
        ) : matches.length === 0 ? (
          <span className="text-gray-500 text-sm">
            {t("userProfile_noMatches")}
          </span>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 shrink-0 border-b border-white/5 py-2 sm:flex sm:justify-between sm:gap-3 sm:pb-2.5 sm:pt-1.5 last:border-none last:pb-0"
            >
              <div className="col-start-2 row-start-1 sm:w-20">
                <span
                  className={`font-bold uppercase text-base sm:text-xl ${resultColors[match.result]}`}
                >
                  {t(`userProfile_match_${match.result}`)}
                </span>
              </div>

              <div className="col-start-1 row-start-1 row-span-2 flex items-center justify-center sm:w-12">
                <img
                  src={getMatchIcon(match)}
                  alt={t(`userProfile_match_${match.result}`)}
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                />
              </div>

              <div className="col-start-3 row-start-1 text-right sm:text-center sm:w-30 whitespace-nowrap font-bold text-white text-base sm:text-xl">
                {match.score}
              </div>

              <div className="col-start-2 row-start-2 min-w-0 truncate text-left text-sm sm:text-lg uppercase sm:w-36">
                <span className="text-pacova-pink">{t("userProfile_vs")}</span>{" "}
                {match.opponent}
              </div>

              <div className="col-start-3 row-start-2 text-right text-gray-500 text-xs sm:text-sm font-sans sm:min-w-[70px]">
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
