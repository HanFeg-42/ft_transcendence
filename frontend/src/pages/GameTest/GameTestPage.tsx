// frontend/src/pages/GameTest/GameTestPage.tsx
// import { useCallback } from 'react';
import React from 'react';
import MazeUI from '../../components/game/MazeUI';
import { useLocalGame } from '../../hooks/useLocalGame';
import { useKeyboard } from '../../hooks/useKeyboard';
// import Hud from '../../components/game/Hud';
import HudTop from '../../components/game/HudTop';
import HudPlayer from '../../components/game/HudPlayer';
import styles from './GameTestPage.module.css';
import type { Direction } from '../../../../shared/types/game-types';

const GameTestPage: React.FC = () => {
    const { state, sendInput } = useLocalGame('player-1');
    useKeyboard((dir: Direction) => sendInput(dir));

    return (
        <div className={styles.page}>
            {/* Timer centré en haut */}
            <div className={styles.topBar}>
                <HudTop state={state} />
            </div>

            {/* Joueur 1 : score + vies à gauche */}
            <div className={styles.leftBar}>
                <HudPlayer player={state.players[0]} />
            </div>

            {/* Labyrinthe au centre */}
            <div className={styles.mazeWrapper}>
                <MazeUI state={state} mazeId="circuit" />
            </div>

            {/* Joueur 2 : score + vies à droite */}
            <div className={styles.rightBar}>
                <HudPlayer player={state.players[1]} />
            </div>
        </div>
    );
};

export default GameTestPage;