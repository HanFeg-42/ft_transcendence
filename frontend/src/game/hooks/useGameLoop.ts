// // game/hooks/useGameLoop.ts
// import { useEffect, useRef, useState } from 'react';
// import type { GameState } from '../types';
// import { createGame, tick } from '../game';

// const TICK_INTERVAL_MS = 1000 / 30; // 30 ticks/seconde

// export function useGameLoop(
//     playerIds: number[],
//     timeLimit: number = 360
// ): GameState {
//     // useRef car la logique mute le state directement
//     const stateRef = useRef<GameState>(createGame(playerIds, timeLimit));
    
//     // Ce compteur force le re-render à chaque tick
//     const [, setFrame] = useState(0);

//     useEffect(() => {
//         const interval = setInterval(() => {
//             tick(stateRef.current);
//             setFrame((f) => f + 1);
//         }, TICK_INTERVAL_MS);

//         return () => clearInterval(interval);
//     }, []);

//     return stateRef.current;
// }