import React, { useState } from 'react';
import MazeUI from '../../components/game/MazeUI';
import { useLocalGame } from '../../hooks/useLocalGame';
import { useKeyboard } from '../../hooks/useKeyboard';
import HudTop from '../../components/game/HudTop';
import GameMenu from '../../components/game/GameMenu';
import PixelButton from '../../components/ui/PixelButton';
import type { Direction } from '../../../../shared/types/game-types';
import HudPlayer from '../../components/game/HudPlayer';
import styles from './GameTestPage.module.css';
import { RotDev } from '../../components/game/RotateDevice';
import MobileControls from "../../components/game/MobileControls";

const GameSession: React.FC<{ gameMode: 1 | 2 }> = ({ gameMode }) => {
    const { state, sendInput } = useLocalGame('player-1', gameMode);
    
    useKeyboard((dir: Direction) => sendInput('player-1', dir), 'arrows');
    useKeyboard((dir: Direction) => sendInput('player-2', dir), 'wasd');

    const hasPlayer2 = state.players.length > 1;

    return (
        <>
            <RotDev />
            {state.status === 'playing' && (
                <MobileControls onInput={(dir) => sendInput('player-1', dir)} />
            )}
            
            <div className={styles.page}>
                <div className={styles.topBar}>
                    <HudTop state={state} />
                </div>
                
                <div className={styles.leftBar}>
                    <HudPlayer player={state.players[0]} />
                </div>
                
                <div className={styles.mazeWrapper}>
                    <MazeUI state={state} mazeId="circuit" />
                </div>
                
            
                {hasPlayer2 && (
                    <div className={styles.rightBar}>
                        <HudPlayer player={state.players?.[1]} />
                    </div>
                )}
            </div>


            {state.status !== 'playing' && (
                <div className={styles.gameOverLayout}>
                    <h1 className={styles.gameoverstate}>
                        {state.status === 'won' ? 'WIN 🏆' : 'GAME OVER'}
                    </h1>
                    <h1 className={styles.gameOverScore}>
                        Final Score : {state.players[0]?.score ?? 0}
                    </h1>
                    <PixelButton 
                        variant="outline-green" 
                        size="lg" 
                        onClick={() => window.location.reload()}
                    >
                        RESTART
                    </PixelButton>
                </div>
            )}
        </>
    );
};

const GameTestPage: React.FC = () => {
    const [gameMode, setGameMode] = useState<null | 1 | 2>(null);


    if (gameMode === null) {
        return (
            <>
                <RotDev />
                <GameMenu onSelectMode={(mode) => setGameMode(mode)} />
            </>
        );
    }

    return <GameSession key={gameMode} gameMode={gameMode} />;
};

export default GameTestPage;