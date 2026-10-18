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

// ⭐ Sub-component to handle the actual game session safely
const GameSession: React.FC<{ gameMode: 1 | 2 }> = ({ gameMode }) => {
    // Now the hooks are safe and always called
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
                
                {/* ⭐ Only ONE right bar, protected with optional chaining (?) */}
                {hasPlayer2 && (
                    <div className={styles.rightBar}>
                        <HudPlayer player={state.players?.[1]} />
                    </div>
                )}
            </div>

            {/* Game Over Overlay */}
            {state.status !== 'playing' && (
                <div className={styles.gameOverLayout}>
                    <h1 className={styles.gameOverState}>
                        {state.status === 'won' ? 'WIN 🏆' : 'GAME OVER 💀'}
                    </h1>
                    <h1 className={styles.gameOverScore}>
                        Final Score : {state.players[0]?.score ?? 0}
                    </h1>
                    <PixelButton 
                        variant="filled-green" 
                        size="sm" 
                        onClick={() => window.location.reload()}
                    >
                        RESTART
                    </PixelButton>
                </div>
            )}
        </>
    );
};

// ⭐ Main component handles the Menu
const GameTestPage: React.FC = () => {
    const [gameMode, setGameMode] = useState<null | 1 | 2>(null);

    // If no mode is selected, show the menu
    if (gameMode === null) {
        return (
            <>
                <RotDev />
                <GameMenu onSelectMode={(mode) => setGameMode(mode)} />
            </>
        );
    }

    // If a mode is selected, launch the game session
    // The "key={gameMode}" is CRITICAL! It forces React to completely reset the game 
    // when switching from 1 player to 2 players.
    return <GameSession key={gameMode} gameMode={gameMode} />;
};

export default GameTestPage;