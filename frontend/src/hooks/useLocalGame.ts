// frontend/src/game/hooks/useLocalGame.ts
import { useEffect, useRef, useState } from 'react';
import type { GameState, Direction } from '../../../shared/types/game-types';
import { createGame, tick, applyInput } from '../engine/engine';

const TICK_INTERVAL_MS = 1000 / 30; // 30 ticks/seconde

export function useLocalGame(playerId: string = 'player-1') {
    // ⚠️ useRef car la logique MUTE le state directement
    const stateRef = useRef<GameState>(createGame(playerId));
    const [, setFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            tick(stateRef.current);   // Fait avancer la logique
            setFrame((f) => f + 1);   // Force le re-render React
        }, TICK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    // Fonction pour envoyer un input clavier
    const sendInput = (dir: Direction) => {
        applyInput(stateRef.current, playerId, dir);
    };

    return {
        state: stateRef.current,
        sendInput,
    };
}