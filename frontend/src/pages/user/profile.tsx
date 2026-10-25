import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Background from '../../components/ui/Background';
import Navbar from '../../components/ui/Navbar';
import ProfileCard from '../../components/profile/ProfileCard';
import MatchHistory from '../../components/profile/MatchHistory';
import CurrentRank from '../../components/profile/CurrentRank';
import Achievements from '../../components/profile/Achievements';
import Card from '../../components/ui/Card';
import EditProfileModal from '../../components/profile/EditProfileModal';
import { useAuth } from '../../context/AuthContext';
import {
  getMyProfile,
  updateMyProfile,
  getProfileById,
  type ProfileData,
} from '../../services/userService';
import { getStats, type StatsData } from '../../services/matchService';
import { getLeaderboardRows, type LeaderboardRow } from '../../services/leaderboardService';
import { routeMap } from '../Chat/helpers';

function calculateLevel(wins: number, matchesPlayed: number) {
  const xp = wins * 50 + (matchesPlayed - wins) * 10;
  const level = Math.floor(xp / 500) + 1;
  const currentXp = xp % 500;
  const maxXp = 500;
  return { level, currentXp, maxXp };
}

export function handleSelectTab(tab: string, navigate: (path: string) => void) {
  const path = routeMap[tab];
  if (path) navigate(path);
}

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  const isOwnProfile = !userId;

  useEffect(() => {
    if (!token) return;

    const profileId = userId ? parseInt(userId, 10) : undefined;
    if (userId && isNaN(profileId!)) {
      setError('Invalid user id');
      setLoading(false);
      return;
    }

    const profilePromise = profileId
      ? getProfileById(token, profileId)
      : getMyProfile(token);

    Promise.all([
      profilePromise,
      getStats(token, profileId?.toString()).catch(() => null),
      getLeaderboardRows(token, 100).catch(() => []),
    ])
      .then(([profileData, statsData, leaderboardData]) => {
        setProfile(profileData);
        setStats(statsData);
        setLeaderboard(leaderboardData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[PROFILE] Failed to load:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [token, userId]);

  const handleSave = async (data: { username?: string; bio?: string; avatar?: string }) => {
    if (!token) throw new Error('No token');
    const updated = await updateMyProfile(token, data);
    setProfile(updated);
  };

  const myRankRow = leaderboard.find((row) => row.userId === profile?.id);
  const myRank = myRankRow?.rank ?? 0;
  const myWins = myRankRow?.wins ?? 0;
  const totalPlayers = leaderboard.length;
  const { level, currentXp, maxXp } = calculateLevel(myWins, stats?.matchesPlayed ?? 0);

  return (
    <Background>
      <Navbar activeTab="PROFILE" onSelectTab={(tab) => handleSelectTab(tab, navigate)} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
          {loading ? (
            <Card variant="gray" className="w-full h-full flex items-center justify-center p-8">
              <span className="font-pixelify text-pacova-green text-lg animate-pulse">
                LOADING DATA...
              </span>
            </Card>
          ) : error ? (
            <Card variant="gray" className="w-full h-full flex items-center justify-center p-8 text-center">
              <span className="font-pixelify text-red-500 text-sm">
                FAILED TO LOAD PROFILE
              </span>
            </Card>
          ) : (
            <ProfileCard
              username={profile?.username}
              avatarUrl={profile?.avatarUrl}
              statusText={profile?.statusText || 'Ready to play'}
              bio={profile?.bio}
              level={level}
              currentXp={currentXp}
              maxXp={maxXp}
              stats={stats ? {
                matchesPlayed: stats.matchesPlayed,
                wins: stats.wins,
                losses: stats.losses,
                winRate: stats.winRate,
              } : undefined}
              onEditClick={isOwnProfile ? () => setIsEditOpen(true) : undefined}
            />
          )}
        </div>

        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch flex-1">
            <div className="md:col-span-2 flex flex-col h-full">
              <MatchHistory userId={userId} />
            </div>
            <div className="md:col-span-1 flex h-full">
              <CurrentRank rank={myRank} totalPlayers={totalPlayers} wins={myWins} />
            </div>
          </div>

          <Achievements achievements={profile?.achievements ?? []} />
        </div>
      </main>

      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          profile={profile}
          onSave={handleSave}
          token={token}
        />
      )}
    </Background>
  );
}