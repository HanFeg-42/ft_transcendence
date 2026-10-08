import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Background from '../components/ui/Background';
import Navbar from '../components/ui/Navbar';
import ProfileCard from '../components/ui/ProfileCard';
import GameUI from '../components/ui/GameUI';
import Card from '../components/ui/Card';
import { ICONS } from '../utils/icons';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, updateMyProfile, getProfileById, type ProfileData } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import EditProfileModal from '../components/ui/EditProfileModal';

import championImg from '../assets/achievement/champion.png';
import cherrysImg from '../assets/achievement/cherrys.png';
import ghostHanterImg from '../assets/achievement/ghost-hanter.png';
import pacManiacImg from '../assets/achievement/pac-maniac.png';
import speederImg from '../assets/achievement/speeder.png';
import tournamentImg from '../assets/achievement/tournament.png';

const routeMap: Record<string, string> = {
  HOME: '/home',
  PROFILE: '/profile',
  CHAT: '/chat',
  NOTIFICATION: '/notifications',
  SETTINGS: '/settings',
};

const ACHIEVEMENT_IMAGES: Record<string, string> = {
  'champion': championImg,
  'ghost-hunter': ghostHanterImg,
  'cherry-collector': cherrysImg,
  'speedster': speederImg,
  'pac-maniac': pacManiacImg,
  'tournament-player': tournamentImg,
};

/** Renders the responsive user profile dashboard. */
export default function Profile() { // 2. Nom de composant en Majuscule
  const navigate = useNavigate();
  const { userId } = useParams();
  const { token } = useAuth(); // 3. Extraire le token du contexte React

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);   // ← nouveau

  useEffect(() => {
    if (!token) return;

    const fetchProfile = userId
      ? getProfileById(token, parseInt(userId, 10))   // profil public
      : getMyProfile(token);                          // profil perso

    fetchProfile
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, userId]);
  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) navigate(path);
  };

  const handleSave = async (data: { username?: string; bio?: string; avatar?: string }) => {
    if (!token) throw new Error('No token');
    const updated = await updateMyProfile(token, data);
    setProfile(updated);   // ← met à jour l'UI
  };

  return (
    <Background>
      <Navbar activeTab="PROFILE" onSelectTab={handleSelectTab} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* COLONNE GAUCHE : Profil */}
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
              level={profile?.level ?? 1}
              currentXp={profile?.currentXp ?? 0}
              maxXp={profile?.maxXp ?? 1000}
              stats={profile?.stats}
              onEditClick={() => setIsEditOpen(true)} 
            />
          )}
        </div>

        {/* COLONNE DROITE : Match History, Rank & Achievements */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch flex-1">
            <div className="md:col-span-2 flex flex-col h-full">
              <GameUI />
            </div>

            <div className="md:col-span-1 flex h-full">
              <Card variant="gray" className="w-full h-full flex flex-col justify-between items-center text-center p-5 bg-pacova-surface/60 backdrop-blur-sm">
                <span className="font-pixelify text-xl text-pacova-green uppercase tracking-widest self-start">
                  ▼ CURRENT RANK
                </span>
                
                <div className="my-auto flex flex-col items-center gap-2 py-4">
                  <img 
                    src={ICONS.diamond} 
                    alt="Diamond Rank" 
                    className="w-20 h-20 object-contain image-rendering-pixelated drop-shadow-[0_0_15px_rgba(243,32,119,0.6)] animate-pulse motion-reduce:transition-none"
                  />
                  <h3 className="font-pixelify text-xl text-pacova-gray uppercase tracking-wide drop-shadow-[0_0_8px_rgba(142,214,3,0.4)]">
                    DIAMOND II
                  </h3>
                  <div className="text-yellow-400 text-sm tracking-widest">★★★★☆</div>
                  <span className="font-vt323 text-sm text-gray-400 tracking-wider">
                    TOP 12% OF PLAYERS
                  </span>
                </div>
                
                <div className="w-full space-y-1">
                  <div className="w-full h-2.5 bg-black/60 border border-pacova-green/30 rounded-full overflow-hidden p-0.5">
                    <div className="h-full bg-pacova-green rounded-full w-[12%] shadow-[0_0_8px_rgba(142,214,3,0.8)]" />
                  </div>
                  <span className="font-vt323 text-xs text-gray-400 block text-right">12%</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Achievements */}
          <div className="w-full flex flex-col gap-4 mt-4">
            <span className="font-pixelify text-xl text-pacova-pink uppercase tracking-widest block pl-1">
              ▼ ACHIEVEMENTS
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {profile?.achievements?.map((item) => (
                <Card
                  key={item.id}
                  variant="gray"
                  className={`group flex flex-col items-center justify-between text-center p-4 
                            bg-pacova-surface/80 border 
                            ${item.unlocked ? item.borderColor : 'border-white/5 opacity-60'}
                            hover:drop-shadow-${item.borderColor} transform hover:scale-105 transition-all duration-300 ease-out 
                            min-h-[190px] cursor-pointer`}
                >
                  <div className="w-full flex-1 flex items-center justify-center mb-2">
                    <img
                      src={ACHIEVEMENT_IMAGES[item.id]}
                      alt={item.title}
                      className={`w-20 h-20 sm:w-24 sm:h-24 object-contain image-rendering-pixelated
                                ${item.unlocked ? '' : 'grayscale opacity-50'}
                                group-hover:scale-110 transition-transform duration-300`}
                    />
                  </div>

                  <div className="w-full space-y-1.5 mt-auto">
                    <h4 className={`font-pixelify text-xs sm:text-sm font-bold uppercase tracking-wider 
                                  ${item.unlocked ? item.textColor : 'text-gray-500'}`}>
                      {item.title}
                    </h4>
                    <p className="font-vt323 text-xs sm:text-sm text-gray-300 leading-tight tracking-wide px-1">
                      {item.description}
                    </p>

                    {item.progress > 0 && !item.unlocked && (
                      <div className="w-full bg-black/60 rounded-full h-1.5 mt-2">
                        <div
                          className="h-full bg-pacova-green rounded-full transition-all duration-500"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

        </div>

      </main>
         {/* Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        profile={profile}
        onSave={handleSave}
        token={token}
      />
    </Background>
  );
}