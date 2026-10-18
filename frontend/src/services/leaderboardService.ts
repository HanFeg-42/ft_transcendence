export interface LeaderboardEntry {
	userId: number;
	wins: number;
}

export interface DirectoryUser {
	id: number;
	username: string;
	avatar: string | null;
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
export async function getDirectory(token: string): Promise<DirectoryUser[]> {
	const response = await fetch(`/api/directory`, {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
		}
	});
	if (!response.ok) {
		throw new Error('Failed to get directory');
	}
	return response.json();
}