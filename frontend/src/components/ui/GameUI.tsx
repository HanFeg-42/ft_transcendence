import React from 'react';
import Card from './Card';

export interface MatchRecord {
  id: string;
  result: 'WIN' | 'LOSS';
  emoji: string; // Temporary emoji icon
  score: string;
  opponent: string;
  timeAgo: string;
}

interface MatchHistoryProps {
  matches?: MatchRecord[];
}

const defaultMatches: MatchRecord[] = [
  { id: '1', result: 'WIN', emoji: '🟡', score: '8 - 3', opponent: 'HANANE', timeAgo: '2 min ago' },
  { id: '2', result: 'LOSS', emoji: '🔴', score: '4 - 8', opponent: 'OMAR', timeAgo: 'Yesterday' },
  { id: '3', result: 'WIN', emoji: '🟠', score: '8 - 1', opponent: 'SARA', timeAgo: '2 days ago' },
  { id: '4', result: 'WIN', emoji: '🔵', score: '7 - 2', opponent: 'YASSINE', timeAgo: '3 days ago' },
  { id: '5', result: 'LOSS', emoji: '⚪', score: '5 - 7', opponent: 'ADIL', timeAgo: '5 days ago' },
];

export const GameUI: React.FC<MatchHistoryProps> = ({ matches = defaultMatches }) => {
  return (

 <Card variant="gray" className="w-full max-w-xl">
      <h3 className="font-pixelify text-xl text-pacova-pink mb-4 flex items-center gap-2">
        <span>---</span> MATCH HISTORY
      </h3>

      <div className="flex flex-col gap-2.5 font-vt323 text-xl">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex items-center justify-between bg-black/50 p-3 border border-white/5 hover:border-pacova-pink/40 transition-colors"
          >
            {/* WIN / LOSS Indicator */}
            <span
              className={`font-pixelify text-sm w-12 ${
                match.result === 'WIN' ? 'text-pacova-green' : 'text-red-500'
              }`}
            >
              {match.result}
            </span>

            {/* Emoji Icon Placeholder */}
            <span className="text-2xl select-none">{match.emoji}</span>

            {/* Score */}
            <span className="text-white tracking-widest px-2">{match.score}</span>

            {/* Opponent */}
            <span className="text-pacova-pink uppercase tracking-wide">
              VS {match.opponent}
            </span>

            {/* Time Ago */}
            <span className="text-gray-500 text-base">{match.timeAgo}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default GameUI;