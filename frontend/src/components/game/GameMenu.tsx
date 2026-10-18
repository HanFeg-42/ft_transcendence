// frontend/src/components/game/GameMenu.tsx
import React from 'react';
import PixelButton from '../ui/PixelButton';
import styles from './GameMenu.module.css';

interface GameMenuProps {
    onSelectMode: (mode: 1 | 2) => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ onSelectMode }) => {
    return (
        <div className={styles.menuOverlay}>
            <h1 className={styles.title}>PAC-MAN</h1>
            <p className={styles.subtitle}>CHOOSE YOUR GAME MODE</p>
            
            <div className={styles.buttonGroup}>
                {/* ⭐ On utilise PixelButton avec la variante "outline-magenta" */}
                <PixelButton 
                    variant="outline-magenta" 
                    size="md" 
                    onClick={() => onSelectMode(1)}
                >
                    1 PLAYER
                </PixelButton>
                
                {/* ⭐ Une autre variante pour le 2ème bouton */}
                <PixelButton 
                    variant="outline-green" 
                    size="md" 
                    onClick={() => onSelectMode(2)}
                >
                    2 PLAYERS
                </PixelButton>
            </div>
        </div>
    );
};

export default GameMenu;