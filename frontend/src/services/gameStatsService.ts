export interface StatsData{
    matchesPlayed: number;
    ghostsEaten: number;
    pelletsEaten: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
}

export interface MatchData {
  id: string;             
  matchId: string;
  userId: number;
  slot: number;
  result: 'WIN' | 'LOSS' | 'DRAW' | null;
  score: number;
  livesRemaining: number;
  joinedAt: string;
  match: {
    id: string;
    mode: string;
    status: string;
    startedAt: string | null;
    endedAt: string | null;
    winnerUserId: number | null;
    participants: MatchData[];  // récursif
  };
}

