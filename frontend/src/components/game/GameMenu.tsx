import React from 'react';
import { useTranslation } from 'react-i18next';
import PixelButton from '../ui/PixelButton';
import styles from './GameMenu.module.css';
import Background from '../ui/Background';

interface GameMenuProps {
  onSelectMode: (mode: 1 | 2) => void;
}
const GameMenu: React.FC<GameMenuProps> = ({ onSelectMode }) => {
  const { t } = useTranslation();

  return (
    <Background>
      <div className={styles.menuOverlay}>
        <p className={styles.title}>
          ▼ {t('local_game_choose_mode')} ▼
        </p>

        <div className={styles.buttonGroup}>
          <PixelButton
            variant="filled-magenta"
            size="md"
            onClick={() => onSelectMode(1)}
          >
            {t('local_game_one_player')}
          </PixelButton>

          <PixelButton
            variant="filled-green"
            size="md"
            onClick={() => onSelectMode(2)}
          >
            {t('local_game_two_players')}
          </PixelButton>
        </div>
      </div>
    </Background>
  );
};

export default GameMenu;