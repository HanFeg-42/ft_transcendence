
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Background from '../../components/ui/Background';
import Navbar from '../../components/ui/Navbar';
import GameModeCard from '../../components/ui/GameModeCard';
import PixelButton from '../../components/ui/PixelButton';
// import { routeMap } from '../Chat/helpers';
import { handleSelectTab } from '../user/profile';



export default function SelectMode() {
  const [selectedMode, setSelectedMode] = useState('LOCAL');

  const navigate = useNavigate();
  const handleContinue = () => {
    if (selectedMode === 'LOCAL') {
        navigate('/game?mode=local');
    } else if (selectedMode === 'REMOTE') {
        navigate('/game/online');
    } else if (selectedMode === 'BOT') {
        alert('Bot mode coming soon!');
    }
};
  return (
    <Background>
      <Navbar activeTab="HOME" onSelectTab={(tab) => handleSelectTab(tab, navigate)}/>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Titre de sélection */}
        <div className="text-center">
          <h1 className="font-press-start text-3xl text-pacova-pink drop-shadow-glow-pink mb-2 animate-[float_3s_ease-in-out_infinite]">
            SELECT MODE
          </h1>
          <p className="font-vt323 text-xl text-pacova-green">
            ▼ CHOOSE YOUR GAME MODE ▼
          </p>
        </div>

        {/* Grille des cartes de jeu */}
        <div className="flex flex-wrap justify-center gap-6">
          <GameModeCard
            title="LOCAL"
            description="Play with friends on the same screen"
            icon="👻"
            selected={selectedMode === 'LOCAL'}
            onClick={() => setSelectedMode('LOCAL')}
          />
          <GameModeCard
            title="REMOTE"
            description="Challenge players online worldwide"
            icon="🌐"
            selected={selectedMode === 'REMOTE'}
            onClick={() => setSelectedMode('REMOTE')}
          />
          <GameModeCard
            title="BOT"
            description="Practice against artificial intelligence"
            icon="🤖"
            selected={selectedMode === 'BOT'}
            onClick={() => setSelectedMode('BOT')}
          />
        </div>

        {/* Bouton de confirmation */}
        <PixelButton variant="outline-green" size="lg" className="mt-4" onClick={handleContinue}>
          CONTINUE
        </PixelButton>
      </main>
    </Background>
  );
}

