import Background from '../components/ui/Background';
import Navbar from '../components/ui/Navbar';
import ProfileCard from '../components/ui/ProfileCard';
import GameUI from '../components/ui/GameUI';
import Card from '../components/ui/Card';
import { ICONS } from '../utils/icons';
import { useNavigate } from 'react-router-dom';

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

const ACHIEVEMENTS_DATA = [
  { id: 'champion', title: 'CHAMPION', description: 'Win 100 matches', image: championImg },
  { id: 'ghost-hunter', title: 'GHOST HUNTER', description: 'Defeat 50 ghosts', image: ghostHanterImg },
  { id: 'cherry-collector', title: 'CHERRY COLLECTOR', description: 'Collect 200 cherries', image: cherrysImg },
  { id: 'speedster', title: 'SPEEDSTER', description: 'Win 10 matches in a row', image: speederImg },
  { id: 'pac-maniac', title: 'PAC-MANIAC', description: 'Play 500 matches', image: pacManiacImg },
  { id: 'tournament-player', title: 'TOURNAMENT PLAYER', description: 'Join 10 tournaments', image: tournamentImg },
];

export default function ProfilePage() {
  const navigate = useNavigate();

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) navigate(path);
  };

  return (
    <Background>
      <Navbar activeTab="PROFILE" onSelectTab={handleSelectTab} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* COLONNE GAUCHE : Profil sans conteneur superflu autour */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
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

        {/* COLONNE DROITE : Match History, Rank en haut & Achievements en bas */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          
          {/* Ligne du Haut : Match History et Current Rank s'alignent parfaitement sur la hauteur */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch flex-1">
            
            {/* Match History */}
            <div className="md:col-span-2 flex flex-col h-full">
              <GameUI />
            </div>

            {/* Current Rank */}
            <div className="md:col-span-1 flex h-full">
              <Card variant="gray" className="w-full h-full flex flex-col justify-between items-center text-center p-5 bg-pacova-surface/60 backdrop-blur-sm">
                <span className="font-pixelify text-xl text-pacova-green uppercase tracking-widest self-start">
                  ▼ CURRENT RANK
                </span>
                
                <div className="my-auto flex flex-col items-center gap-2 py-4">
                  <img 
                    src={ICONS.diamond} 
                    alt="Diamond Rank" 
                    className="w-20 h-20 object-contain image-rendering-pixelated drop-shadow-[0_0_15px_rgba(243,32,119,0.6)] animate-pulse"
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

            {/* Ligne du Bas : Achievements Cards indépendantes et immersives */}
          <div className="w-full flex flex-col gap-4 mt-4">
            {/* Titre de section épuré sans grand conteneur */}
            <span className="font-pixelify text-xl text-pacova-pink uppercase tracking-widest block pl-1">
              ▼ ACHIEVEMENTS
            </span>

            {/* Grille de cartes individuelles inspirée de votre modèle Figma */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {ACHIEVEMENTS_DATA.map((item) => (
                /* 💡 On réutilise votre composant <Card> individuellement avec la variante 'gray' ou 'pink' */
                <Card 
                  key={item.id} 
                  variant="gray" 
                  className="group flex flex-col items-center justify-between text-center p-4 
                            bg-pacova-surface/80 border border-white/5
                            hover:border-yellow-500/40 hover:drop-shadow-[0_0_15px_rgba(234,179,8,0.25)]
                            transform hover:scale-105 transition-all duration-300 ease-out 
                            min-h-[190px] cursor-pointer"
                >
                  {/* 1. L'image du succès prend une place maximale en haut */}
                  <div className="w-full flex-1 flex items-center justify-center mb-2">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain image-rendering-pixelated
                                drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* 2. Les informations textuelles écrites à l'intérieur, en bas de la carte */}
                  <div className="w-full space-y-1.5 mt-auto">
                    <h4 className="font-pixelify text-xs sm:text-sm text-yellow-400 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {item.title}
                    </h4>
                    <p className="font-vt323 text-xs sm:text-sm text-gray-300 leading-tight tracking-wide px-1">
                      {item.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>


        </div>

      </main>
    </Background>
  );
}
