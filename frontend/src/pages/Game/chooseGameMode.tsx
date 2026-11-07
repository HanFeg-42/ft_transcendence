
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Background from '../../components/ui/Background';
import Navbar from '../../components/ui/Navbar';
import GameModeCard from '../../components/ui/GameModeCard';
import PixelButton from '../../components/ui/PixelButton';
// import { routeMap } from '../Chat/helpers';
import { handleSelectTab } from '../user/profile';
import { useTranslation } from 'react-i18next';


export default function SelectMode() {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState('LOCAL');

  const navigate = useNavigate();
  const handleContinue = () => {
    if (selectedMode === 'LOCAL') {
        navigate('/game?mode=local');
    } else if (selectedMode === 'REMOTE') {
        navigate('/game/online');
    } else if (selectedMode === 'BOT') {
        navigate('/game/bot');
    }
};
  return (
    <Background>
      <Navbar activeTab="HOME" onSelectTab={(tab) => handleSelectTab(tab, navigate)}/>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Titre de sélection */}
        <div className="text-center">
          <h1 className="font-press-start text-3xl text-pacova-pink drop-shadow-glow-pink mb-2 animate-[float_3s_ease-in-out_infinite]">
            {t('game_mode_select_title')}
          </h1>
          <p className="font-vt323 text-xl text-pacova-green">
            {t('game_mode_choose')}
          </p>
        </div>

        {/* Grille des cartes de jeu */}
        <GameModeCard
          title={t('game_mode_local')}
          description={t('game_mode_local_description')}
          icon="👻"
          selected={selectedMode === 'LOCAL'}
          onClick={() => setSelectedMode('LOCAL')}
        />

        <GameModeCard
          title={t('game_mode_remote')}
          description={t('game_mode_remote_description')}
          icon="🌐"
          selected={selectedMode === 'REMOTE'}
          onClick={() => setSelectedMode('REMOTE')}
        />

        <GameModeCard
          title={t('game_mode_bot')}
          description={t('game_mode_bot_description')}
          icon="🤖"
          selected={selectedMode === 'BOT'}
          onClick={() => setSelectedMode('BOT')}
        />


        {/* Bouton de confirmation */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <PixelButton variant="outline-magenta" size="lg" onClick={() => navigate('/how-to-play')}>
            {t('game_mode_how_to_play')}
          </PixelButton>
          <PixelButton variant="outline-green" size="lg" onClick={handleContinue}>
            {t('game_mode_continue')}
          </PixelButton>
        </div>
      </main>
    </Background>
  );
}

