// frontend/src/pages/GameTest/GameTestPage.tsx
import { useCallback } from 'react';
import MazeUI from '../../components/game/MazeUI';
import { useLocalGame } from '../../hooks/useLocalGame';
import { useKeyboard } from '../../hooks/useKeyboard';
import Huded from '../../components/game/Hud';
import styles from './GameTestPage.module.css';
import type { Direction } from '../../../../shared/types/game-types';


const GameTestPage: React.FC = () => {
    const { state, sendInput } = useLocalGame('player-1');

    useKeyboard((dir: Direction) => sendInput(dir));

    return (
        <div className={styles.page}>
            <Huded state={state} />
            <div className={styles.mazeWrapper}>
                <MazeUI state={state} mazeId="circuit" />
            </div>
        </div>
    );
};

export default GameTestPage;
