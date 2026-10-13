import { authenticatedFetch } from "./authenticatedFetch";

const API_URL = '/api/users';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  image: string;
  borderColor: string;
  textColor: string;
  unlocked: boolean;
  progress: number;
}

export interface ProfileData {
  id?: number;
  username: string;
  avatarUrl?: string;
  bio?: string;
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
  achievements?: Achievement[];
}

export async function getMyProfile(token: string,refreshAccessToken: () => Promise<string | null>): Promise<ProfileData> {
  const response = await authenticatedFetch(
    `${API_URL}/profile/me`,
    token,
    refreshAccessToken,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Impossible de charger le profil');
  }

  return response.json();
}

export async function getProfileById(
  token: string,
  userId: number,
  refreshAccessToken: () => Promise<string | null>,
): Promise<ProfileData> {
  const response = await authenticatedFetch(
    `${API_URL}/profile/${userId}`,
    token,
    refreshAccessToken,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Impossible de charger le profil');
  }

  return response.json();
}

/**
 * Updates the authenticated user's profile.
 *
 * Uses authenticatedFetch so that if the access token has expired,
 * the request can refresh the token and retry once automatically.
 *
 * @param token - The current access token.
 * @param data - The profile fields to update.
 * @param refreshAccessToken - Callback that obtains a new access token.
 * @returns The updated profile data.
 * @throws Error if the request fails after the retry or the update is rejected.
 */
export async function updateMyProfile(
  token: string,
  data: Partial<ProfileData>,
  refreshAccessToken: () => Promise<string | null>,
): Promise<ProfileData> {
  const response = await authenticatedFetch(
    `${API_URL}/profile/me`,
    token,
    refreshAccessToken,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors de la mise à jour');
  }

  return response.json();
}


/**
 * Fetches another user's public profile.
 *
 * Uses authenticatedFetch to refresh an expired access token and retry
 * the request once, without changing the read-only profile behavior.
 *
 * @param id - The ID of the profile to retrieve.
 * @param token - The current access token.
 * @param refreshAccessToken - Callback that obtains a new access token.
 * @returns The requested user's profile data.
 * @throws Error if the profile cannot be loaded.
 */
export async function getProfile(
  id: number,
  token: string,
  refreshAccessToken: () => Promise<string | null>,
): Promise<ProfileData> {
  const response = await authenticatedFetch(
    `${API_URL}/profile/${id}`,
    token,
    refreshAccessToken,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Impossible de charger le profil');
  }

  return response.json();
}
