const API_URL = '/api/users';

export interface ProfileData {
  username: string;
  avatar?: string;
  statusText?: string;
  level?: number;
  currentXp?: number;
  maxXp?: number;
  stats?: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}

export async function getMyProfile(token: string): Promise<ProfileData> {
  const response = await fetch(`${API_URL}/profile/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger le profil');
  }

  return response.json();
}

export async function updateMyProfile(data: Partial<ProfileData>): Promise<ProfileData> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_URL}/profile/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erreur lors de la mise à jour');
  }

  return response.json();
}