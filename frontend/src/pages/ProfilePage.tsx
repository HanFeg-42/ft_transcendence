import Background from '../components/ui/Background';
import Navbar from '../components/ui/Navbar';
import ProfileCard from '../components/ui/ProfileCard';
import GameUI from '../components/ui/GameUI';
import Card from '../components/ui/Card';
import Achievements from '../components/ui/Achievements';
import { ICONS } from '../utils/icons';
import { useNavigate } from 'react-router-dom';

const routeMap: Record<string, string> = {
  HOME: '/home',
  PROFILE: '/profile',
  CHAT: '/chat',
  NOTIFICATION: '/notifications',
  SETTINGS: '/settings',
};

export default function ProfilePage() {
  const navigate = useNavigate();

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) {
      navigate(path);
    }
  };

  return (
    <Background>
      <Navbar activeTab="PROFILE" onSelectTab={handleSelectTab} />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* SECTION SUPERIEURE : PROFIL + MATCH HISTORY + RANK */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* COLONNE GAUCHE : CARTE PROFIL (4 cols) */}
          <div className="lg:col-span-4 flex justify-center">
            <ProfileCard
              username="NOUSS"
              statusText="Ready to play"
              level={24}
              currentXp={2350}
              maxXp={3000}
              stats={{
                matchesPlayed: 243,
                wins: 176,
                losses: 67,
                winRate: 72,
              }}
            />
          </div>

          {/* COLONNE CENTRALE : MATCH HISTORY (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <GameUI />
          </div>

          {/* COLONNE DROITE : RANK CARD (3 cols) */}
          <div className="lg:col-span-3 flex">
            <Card variant="pink" className="w-full flex flex-col items-center justify-between text-center p-5">
              <span className="font-pixelify text-xs text-pacova-pink uppercase tracking-widest self-start">
                ▼ CURRENT RANK
              </span>
              
              <div className="my-auto flex flex-col items-center gap-2 py-4">
                <img 
                  src={ICONS.diamond} 
                  alt="Diamond Rank" 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain image-rendering-pixelated drop-shadow-[0_0_12px_rgba(243,32,119,0.5)]"
                />
                <h3 className="font-pixelify text-xl text-pacova-green uppercase tracking-wide">
                  DIAMOND II
                </h3>
                <div className="text-yellow-400 text-xs">★★★★☆</div>
                <span className="font-vt323 text-xs sm:text-sm text-gray-400">
                  TOP 12% OF PLAYERS
                </span>
              </div>
              
              <div className="w-full space-y-1">
                <div className="w-full h-2.5 bg-black/60 border border-pacova-green/40 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-pacova-green rounded-full w-[12%] shadow-neon-green" />
                </div>
                <span className="font-vt323 text-xs text-gray-400 block text-right">12%</span>
              </div>
            </Card>
          </div>

        </div>

        {/* SECTION INFERIEURE : ACHIEVEMENTS (12 cols full width) */}
        <div className="w-full">
          <Achievements />
        </div>

      </main>
    </Background>
  );
}