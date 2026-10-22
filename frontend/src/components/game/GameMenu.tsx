// frontend/src/components/game/GameMenu.tsx
import React from 'react';
import PixelButton from '../ui/PixelButton';
import styles from './GameMenu.module.css';
import Background from '../ui/Background';

interface GameMenuProps {
    onSelectMode: (mode: 1 | 2) => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ onSelectMode }) => {
    return (
        <Background>
            <div className={styles.menuOverlay}>
                <p className={styles.title}>▼ CHOOSE YOUR GAME MODE ▼</p>
                
                <div className={styles.buttonGroup}>
                    {/* ⭐ On utilise PixelButton avec la variante "outline-magenta" */}
                    <PixelButton 
                        variant="filled-magenta" 
                        size="md" 
                        onClick={() => onSelectMode(1)}
                    >
                        1 PLAYER
                    </PixelButton>
                    
                    {/* ⭐ Une autre variante pour le 2ème bouton */}
                    <PixelButton 
                        variant="filled-green" 
                        size="md" 
                        onClick={() => onSelectMode(2)}
                    >
                        2 PLAYERS
                    </PixelButton>
                </div>
            </div>
        </Background>
    );
};

export default GameMenu;