import React from 'react';
import MazeUI from '../../components/game/MazeUI';
import useLocalGame from '../../hooks/useLocalGame';
import { useKeyboard } from '../../hooks/useKeyboard';
import HudTop from '../../components/game/HudTop';
import PixelButton from '../../components/ui/PixelButton';
import type { Direction } from '../../../../shared/types/game-types';
import HudPlayer from '../../components/game/HudPlayer';
import styles from './GameTestPage.module.css';
import { RotDev } from '../../components/game/RotateDevice';
import MobileControls from "../../components/game/MobileControls"

const GameTestPage: React.FC = () => {
    const { state, sendInput } = useLocalGame('player-1');
    useKeyboard((dir: Direction) => sendInput(dir));

    return (
        <>
        <RotDev/>
        {state.status === 'playing' && <MobileControls onInput={sendInput}/>}
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
            {state.status !== 'playing' && (
                <div className={styles.gameOverLayout}>
                    <h1 className={styles.gameoverstate}>
                        {state.status === 'WIN'? 'win':'GAME OVER'}
                    </h1>
                    
                    <h1 className={styles.gameOverScore}>
                        Final Score : {state.players[1].score}
                    </h1>

                    <PixelButton variant="filledgreen" size="sm">
                        RESTART
                    </PixelButton>
                </div>
            )}
        </div>
        </>
    );
};

export default GameTestPage;

        // <PixelButton variant="olive-yellow" size="sm" className="w-full py-3 text-base tracking-widest" onClick={onEditClick}>