import React, { useEffect, useState } from "react";
import Card from "../ui/Card";
import { useAuth } from "../../context/AuthContext";
import { getMatchHistory, type MatchHistoryItem } from "../../services/matchService";
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

export const MatchHistory: React.FC<MatchHistoryProps> = ({ userId }) => {
  const { token } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const loadMatchHistory = async () => {
      try {
        const list: Match[] = [];
        const rows: MatchHistoryItem[] = await getMatchHistory(token, userId);

        for (const row of rows) {
          const opponent = row.match.participants.find(
            (p) => p.userId !== row.userId,
          )!;
          const opponentProfile = await getProfileById(token, opponent.userId);

          list.push({
            id: row.id,
            result: row.result!,
            score: `${row.score} - ${opponent.score}`,
            opponent: opponentProfile.username,
            time: new Date(row.match.startedAt).toLocaleDateString(),
          });
        }
        setMatches(list);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    loadMatchHistory();
  }, [token, userId]);

  const getMatchIcon = (match: Match) => {
    if (match.result === "WIN") return packman3d;
    switch (match.opponentColor) {
      case "red": return gostRed;
      case "blue": return gostBlue;
      case "orange": return gostOrange;
      case "purple": return gostPurple;
      case "pink": return gostPink;
      default: return gostRed;
    }
  };

  return (
    <Card variant="gray" className="w-full h-full p-5 bg-pacova-surface/60 backdrop-blur-sm flex flex-col justify-between">
      <div className="w-full mb-4">
        <span className="font-pixelify text-xl text-pacova-green uppercase tracking-widest block pl-1">
          ▼ MATCH HISTORY
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between font-vt323 text-xl tracking-wider text-gray-300">
        {loading ? (
          <span className="text-gray-500 text-sm">Loading...</span>
        ) : matches.length === 0 ? (
          <span className="text-gray-500 text-sm">No matches yet</span>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="flex items-center justify-between border-b border-white/5 pb-2.5 pt-1.5 last:border-none last:pb-0"
            >
              <div className="w-16 sm:w-20">
                <span className={`font-bold uppercase ${match.result === "WIN" ? "text-pacova-green" : "text-red-500"}`}>
                  {match.result}
                </span>
              </div>
              <div className="flex items-center justify-center w-12">
                <img src={getMatchIcon(match)} alt={match.result} className="w-9 h-9 object-contain" />
              </div>
              <div className="w-20 text-center font-bold text-white text-2xl">
                {match.score}
              </div>
              <div className="w-28 sm:w-36 text-left text-gray-400 font-sans text-xs uppercase">
                VS {match.opponent}
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