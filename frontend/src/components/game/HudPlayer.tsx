// frontend/src/game/ui/HudPlayer.tsx
import React from 'react';
import type { Player } from '../../../../shared/types/game-types';
import styles from './Hud.module.css';

interface HudPlayerProps {
    player?: Player;
}

const HudPlayer: React.FC<HudPlayerProps> = ({ player }) => {
    if (!player) {
        return <div className={styles.waiting}>En attente...</div>;
    }

    return (
        <div className={styles.playerBlock}>
            <div className={styles.scoreLine}>
                <span className={styles.label}>SCORE</span>
                <span className={styles.value}>{player.score}</span>
            </div>
            <span className={styles.livesLabel}>LIVES</span>
            <div className={styles.hearts}>
                {Array.from({ length: player.lives }).map((_, i) => (
                    <span key={i} className={styles.heart}>❤</span>
                ))}
            </div>
        </div>
    );
};

export default HudPlayer;