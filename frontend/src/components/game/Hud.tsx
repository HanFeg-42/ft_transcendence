import React from 'react';
import type { GameState } from '../../../../shared/types/game-types';
import styles from './Hud.module.css';

interface HudProps {
    state: GameState;
}

/** Formate les secondes en MM:SS */
const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const Hud: React.FC<HudProps> = ({ state }) => {
    const { players, timeRemaining } = state;

    const player1 = players[0];
    const player2 = players[1];

    return (
        <div className={styles.hud}>
            {/* ═══ Ligne du haut : SCORE / TIMER / SCORE ═══ */}
            <div className={styles.topRow}>
                <div className={styles.scoreBlock}>
                    <span className={styles.label}>SCORE</span>
                    <span className={styles.value}>
                        {player1?.score ?? 0}
                    </span>
                </div>

                <div className={styles.timerBlock}>
                    <span className={styles.timer}>{formatTime(timeRemaining)}</span>
                </div>

                <div className={styles.scoreBlock}>
                    <span className={styles.label}>SCORE</span>
                    <span className={styles.value}>
                        {player2?.score ?? 0}
                    </span>
                </div>
            </div>

            {/* ═══ Ligne du milieu : LIVES / MAZE / LIVES ═══ */}
            <div className={styles.middleRow}>
                <div className={styles.livesBlock}>
                    <span className={styles.livesLabel}>LIVES</span>
                    <div className={styles.hearts}>
                        {player1 && Array.from({ length: player1.lives }).map((_, i) => (
                            <span key={i} className={styles.heart}>❤</span>
                        ))}
                    </div>
                </div>

                {/* Le labyrinthe viendra ici (enfant du Hud) */}

                <div className={styles.livesBlock}>
                    <span className={styles.livesLabel}>LIVES</span>
                    <div className={styles.hearts}>
                        {player2 && Array.from({ length: player2.lives }).map((_, i) => (
                            <span key={i} className={styles.heart}>❤</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hud;