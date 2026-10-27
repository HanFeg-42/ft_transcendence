
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Background from '../../components/ui/Background';
import Navbar from '../../components/ui/Navbar';
import Card from '../../components/ui/Card';
import ProfileCard from '../../components/profile/ProfileCard';
import PixelButton from '../../components/ui/PixelButton';
import { useAuth } from '../../context/AuthContext';
import { getProfile, type ProfileData } from '../../services/userService';
import { routeMap } from '../Chat/helpers';

// Read-only view of another user's profile.
// Separate from profile.tsx, which displays the current user's profile.
export default function UserProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { token } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getProfile(Number(userId), token)
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error('[USER-PROFILE] Failed to load profile:', err);
        setError(t('userProfile_loadError'));
        setLoading(false);
      });
  }, [token, userId, t]);

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) navigate(path);
  };

  const statusText =
    !profile?.statusText || profile.statusText === 'Ready to play'
      ? t('userProfile_readyToPlay')
      : profile.statusText;

  return (
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={handleSelectTab} />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-4">
        <div className="w-full max-w-sm">
          {loading ? (
            <Card
              variant="gray"
              className="w-full flex items-center justify-center p-8"
            >
              <span className="font-pixelify text-pacova-green text-lg animate-pulse">
                {t('userProfile_loading')}
              </span>
            </Card>
          ) : error ? (
            <Card
              variant="gray"
              className="w-full flex items-center justify-center p-8 text-center"
            >
              <span className="font-pixelify text-red-500 text-sm">
                {error}
              </span>
            </Card>
          ) : (
            <ProfileCard
              username={profile?.username}
              avatarUrl={profile?.avatarUrl}
              statusText={statusText}
              level={profile?.level ?? 1}
              currentXp={profile?.currentXp ?? 0}
              maxXp={profile?.maxXp ?? 1000}
              stats={profile?.stats}
            />
          )}
        </div>

        <PixelButton
          variant="outline-green"
          size="md"
          onClick={() => navigate('/chat')}
        >
          {t('userProfile_backToChat')}
        </PixelButton>
      </main>
    </Background>
  );
}
