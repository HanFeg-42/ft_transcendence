import React from 'react';
import type { GameState } from '../../../../shared/types/game-types';
import styles from './Hud.module.css';

interface HudTopProps {
    state: GameState;
}

const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const HudTop: React.FC<HudTopProps> = ({ state }) => {
    const { timeRemaining } = state;
    return (
        <>
            <div className={styles.timerBlock}>
                <span className={styles.timer}>{formatTime(timeRemaining)}</span>
            </div>
        </>
    );
};

export default HudTop;