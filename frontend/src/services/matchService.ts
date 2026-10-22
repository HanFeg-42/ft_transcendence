const API_URL = "/api/game";

export interface MatchParticipant {
  id: string;
  matchId: string;
  userId: number;
  slot: number;
  result: string;
  score: number;
  livesRemaining: number;
  joinedAt: string;
}

export interface Match {
  id: string;
  mode: string;
  status: string;
  mazeSeed: string;
  timeLimitSeconds: number;
  startedAt: string;
  endedAt: string;
  winnerUserId: number;
  createdAt: string;
  participants: MatchParticipant[];
}

export interface StatsData {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface MatchHistoryItem extends MatchParticipant {
  match: Match;
}

export const getStats = async (token: string, userId?: string) => {
  const url = userId ? `${API_URL}/stats/${userId}` : `${API_URL}/stats`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }
  return response.json();
};

export const getMatchHistory = async (token: string, userId?: string) => {
  const url = userId ? `${API_URL}/matches/${userId}` : `${API_URL}/matches`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch match history");
  }
  return response.json();
};
