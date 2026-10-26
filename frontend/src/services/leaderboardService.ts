export interface LeaderboardEntry {
	userId: number;
	wins: number;
}

export async function getLeaderboard(token: string, limit: number): Promise<LeaderboardEntry[]> {
	const response = await fetch(`/api/game/leaderboard?limit=${limit}`, {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
		}
	});
	if (!response.ok) {
		throw new Error('Failed to fetch leaderboard');
	}
	return response.json();
}

export interface LeaderboardRow {
  rank: number;
  userId: number;
  wins: number;
  username: string;
  avatarUrl: string | null;
}

interface BatchProfile {
  userId: number;
  username: string;
  avatarUrl: string | null;
}

async function getProfilesBatch(token: string, ids: number[]): Promise<BatchProfile[]> {
  const response = await fetch(`/api/users/profile/batch?ids=${ids.join(',')}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch profiles');
  }
  return response.json();
}

export async function getLeaderboardRows(token: string, limit: number): Promise<LeaderboardRow[]> {
  const entries = await getLeaderboard(token, limit);
  if (entries.length === 0) return [];

  let profiles: BatchProfile[] = [];
  try {
    profiles = await getProfilesBatch(token, entries.map((e) => e.userId));
  } catch {
    // names are nice to have: still show the ranking if profiles fail
  }
  const byId = new Map(profiles.map((p) => [p.userId, p]));

  let lastWins = -1;
  let lastRank = 0;
  return entries.map((entry, index) => {
    // equal wins share the same rank (1, 2, 2, 4)
    const rank = entry.wins === lastWins ? lastRank : index + 1;
    lastWins = entry.wins;
    lastRank = rank;

    const profile = byId.get(entry.userId);
    return {
      rank,
      userId: entry.userId,
      wins: entry.wins,
      username: profile?.username ?? `Player #${entry.userId}`,
      avatarUrl: profile?.avatarUrl ?? null,
    };
  });
}
